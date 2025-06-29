# BookSpark Week 1-2 Development Guide

## Sprint 1: Foundation & Twitter Integration (Week 1-2)

### Day 1-2: Project Setup

#### 1. Initialize Next.js Project
```bash
npx create-next-app@latest bookspark --typescript --tailwind --eslint --app
cd bookspark
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install next-auth
npm install @radix-ui/react-dropdown-menu @radix-ui/react-button
npm install lucide-react date-fns
```

#### 2. Environment Setup
Create `.env.local`:
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Twitter API
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

#### 3. Database Schema Setup
Create these tables in Supabase:

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_id TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  twitter_username TEXT,
  twitter_token TEXT,
  twitter_refresh_token TEXT,
  digest_time TIME DEFAULT '08:00:00',
  digest_frequency TEXT DEFAULT 'daily',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  twitter_id TEXT, -- Original tweet ID
  content TEXT NOT NULL,
  author_name TEXT,
  author_username TEXT,
  url TEXT, -- If tweet contains a link
  media_urls TEXT[], -- Images/videos
  summary TEXT, -- AI-generated summary
  content_type TEXT DEFAULT 'tweet', -- tweet, thread, article, image
  suggested_actions JSONB, -- AI action suggestions
  topics TEXT[], -- AI-generated topic tags
  status TEXT DEFAULT 'new', -- new, pending, done, snoozed, archived
  snooze_until TIMESTAMP WITH TIME ZONE,
  bookmark_created_at TIMESTAMP WITH TIME ZONE, -- When user bookmarked on Twitter
  processed_at TIMESTAMP WITH TIME ZONE, -- When we analyzed it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions table (in-app tasks/ideas)
CREATE TABLE actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- task, idea, note
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own actions" ON actions FOR ALL USING (auth.uid()::text = user_id::text);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_status ON bookmarks(status);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_bookmark_id ON actions(bookmark_id);
```

### Day 3-4: Authentication Setup

#### 1. NextAuth Configuration
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { supabase } from '@/lib/supabase'

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'users.read bookmark.read tweet.read offline.access',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'twitter') {
        // Store user in Supabase
        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            twitter_id: profile.id,
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            twitter_username: profile.username,
            twitter_token: account.access_token,
            twitter_refresh_token: account.refresh_token,
          })
          .select()
          .single()

        return !error
      }
      return true
    },
    async session({ session, token }: any) {
      session.user.id = token.sub
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### 2. Create Auth Utilities
Create `lib/auth.ts`:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}
```

### Day 5-7: Twitter API Integration

#### 1. Twitter API Client
Create `lib/twitter.ts`:
```typescript
interface TwitterBookmark {
  id: string
  text: string
  author_id: string
  created_at: string
  attachments?: {
    media_keys?: string[]
  }
  entities?: {
    urls?: Array<{
      expanded_url: string
      display_url: string
    }>
  }
}

interface TwitterUser {
  id: string
  name: string
  username: string
}

export class TwitterClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getBookmarks(maxResults = 100): Promise<{
    bookmarks: TwitterBookmark[]
    users: TwitterUser[]
  }> {
    const url = new URL('https://api.twitter.com/2/users/me/bookmarks')
    url.searchParams.set('max_results', maxResults.toString())
    url.searchParams.set('tweet.fields', 'created_at,author_id,text,attachments,entities')
    url.searchParams.set('user.fields', 'name,username')
    url.searchParams.set('expansions', 'author_id,attachments.media_keys')

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      bookmarks: data.data || [],
      users: data.includes?.users || [],
    }
  }

  async getTweet(tweetId: string): Promise<TwitterBookmark | null> {
    const url = `https://api.twitter.com/2/tweets/${tweetId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  }
}
```

#### 2. Bookmark Sync Service
Create `lib/services/bookmark-sync.ts`:
```typescript
import { supabase } from '@/lib/supabase'
import { TwitterClient } from '@/lib/twitter'

export async function syncUserBookmarks(userId: string) {
  try {
    // Get user's Twitter token
    const { data: user } = await supabase
      .from('users')
      .select('twitter_token, last_sync_at')
      .eq('id', userId)
      .single()

    if (!user?.twitter_token) {
      throw new Error('No Twitter token found')
    }

    const twitter = new TwitterClient(user.twitter_token)
    const { bookmarks, users } = await twitter.getBookmarks()

    // Create a lookup for user data
    const userLookup = users.reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {} as Record<string, typeof users[0]>)

    // Process each bookmark
    for (const bookmark of bookmarks) {
      const author = userLookup[bookmark.author_id]
      
      // Extract URL if present
      let extractedUrl = null
      if (bookmark.entities?.urls?.length) {
        extractedUrl = bookmark.entities.urls[0].expanded_url
      }

      // Store bookmark
      await supabase
        .from('bookmarks')
        .upsert({
          user_id: userId,
          twitter_id: bookmark.id,
          content: bookmark.text,
          author_name: author?.name,
          author_username: author?.username,
          url: extractedUrl,
          bookmark_created_at: bookmark.created_at,
          status: 'new',
        }, {
          onConflict: 'user_id,twitter_id'
        })
    }

    // Update last sync time
    await supabase
      .from('users')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', userId)

    return bookmarks.length
  } catch (error) {
    console.error('Bookmark sync failed:', error)
    throw error
  }
}
```

### Day 8-10: AI Processing

#### 1. OpenAI Integration
Create `lib/ai/content-analyzer.ts`:
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalysisResult {
  summary: string
  contentType: string
  topics: string[]
  suggestedActions: string[]
}

export async function analyzeContent(content: string, url?: string): Promise<AnalysisResult> {
  const prompt = `
Analyze this saved content and provide:
1. A 1-2 sentence summary
2. Content type (tweet, article, tutorial, inspiration, news, etc.)
3. 2-3 relevant topic tags
4. 3-5 suggested actions the user might want to take

Content: "${content}"
${url ? `URL: ${url}` : ''}

Respond in JSON format:
{
  "summary": "Brief summary here",
  "contentType": "tweet",
  "topics": ["topic1", "topic2"],
  "suggestedActions": [
    "Add to task list",
    "Save for inspiration",
    "Set reminder to practice",
    "Research more about this topic",
    "Share with team"
  ]
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  } catch (error) {
    console.error('AI analysis failed:', error)
    
    // Fallback response
    return {
      summary: content.slice(0, 100) + '...',
      contentType: 'unknown',
      topics: [],
      suggestedActions: ['Mark as done', 'Save for later'],
    }
  }
}
```

#### 2. Background Processing
Create `lib/services/content-processor.ts`:
```typescript
import { supabase } from '@/lib/supabase'
import { analyzeContent } from '@/lib/ai/content-analyzer'

export async function processUnanalyzedBookmarks() {
  // Get bookmarks that haven't been processed
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .is('processed_at', null)
    .limit(50)

  if (!bookmarks?.length) return

  for (const bookmark of bookmarks) {
    try {
      const analysis = await analyzeContent(bookmark.content, bookmark.url)
      
      await supabase
        .from('bookmarks')
        .update({
          summary: analysis.summary,
          content_type: analysis.contentType,
          topics: analysis.topics,
          suggested_actions: analysis.suggestedActions,
          processed_at: new Date().toISOString(),
        })
        .eq('id', bookmark.id)

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to process bookmark ${bookmark.id}:`, error)
    }
  }
}
```

### Day 11-14: API Routes & Basic UI

#### 1. API Routes
Create `app/api/bookmarks/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { syncUserBookmarks } from '@/lib/services/bookmark-sync'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const count = await syncUserBookmarks(user.id)
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${count} bookmarks` 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
```

Create `app/api/bookmarks/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'new'
    
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50)
    
    return NextResponse.json({ bookmarks })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}
```

#### 2. Basic Dashboard UI
Create `app/dashboard/page.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Bookmark {
  id: string
  content: string
  summary: string
  author_name: string
  topics: string[]
  suggested_actions: string[]
  status: string
  created_at: string
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchBookmarks()
  }, [])

  async function fetchBookmarks() {
    try {
      const response = await fetch('/api/bookmarks')
      const data = await response.json()
      setBookmarks(data.bookmarks || [])
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncBookmarks() {
    setSyncing(true)
    try {
      const response = await fetch('/api/bookmarks/sync', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        await fetchBookmarks()
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">BookSpark Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
        </div>
        <button
          onClick={syncBookmarks}
          disabled={syncing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Twitter Bookmarks'}
        </button>
      </div>

      <div className="space-y-6">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">@{bookmark.author_name}</p>
                <p className="font-medium">{bookmark.summary || 'Processing...'}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                bookmark.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {bookmark.status}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4 line-clamp-3">{bookmark.content}</p>
            
            {bookmark.topics && bookmark.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {bookmark.topics.map((topic, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                    {topic}
                  </span>
                ))}
              </div>
            )}
            
            {bookmark.suggested_actions && bookmark.suggested_actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bookmark.suggested_actions.map((action, index) => (
                  <button
                    key={index}
                    className="bg-green-50 text-green-700 px-3 py-1 text-sm rounded border border-green-200 hover:bg-green-100"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {bookmarks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No bookmarks found. Sync your Twitter bookmarks to get started!</p>
        </div>
      )}
    </div>
  )
}
```

## Testing Checklist for Week 1-2

### Day 1-7 Goals:
- [ ] Twitter OAuth login works
- [ ] User data is stored in Supabase
- [ ] Twitter bookmarks can be fetched via API
- [ ] Bookmarks are stored in database
- [ ] Basic dashboard displays bookmarks

### Day 8-14 Goals:
- [ ] AI analysis generates summaries and action suggestions
- [ ] Background processing works for new bookmarks
- [ ] Dashboard shows processed bookmarks with AI insights
- [ ] Manual sync button works
- [ ] Actions can be clicked (even if they don't do anything yet)

## Common Issues & Solutions

### Twitter API Issues:
- **Rate limiting**: Implement proper delays between requests
- **Token expiry**: Store refresh tokens and implement token refresh
- **Scope permissions**: Ensure `bookmark.read` scope is requested

### AI Processing Issues:
- **Cost management**: Use GPT-3.5-turbo, not GPT-4 for summaries
- **Rate limiting**: Add delays between OpenAI API calls
- **JSON parsing errors**: Always have fallback responses

### Database Issues:
- **RLS policies**: Ensure row-level security is properly configured
- **Timestamps**: Use `TIMESTAMP WITH TIME ZONE` for all dates
- **Unique constraints**: Handle conflicts gracefully with upsert

## Week 3 Preview

Next week you'll focus on:
1. **Email Digest System** - Daily emails with bookmark summaries
2. **Action Execution** - Making the suggested action buttons functional
3. **In-app Task Management** - Simple task creation and completion
4. **Snooze Functionality** - Postponing bookmarks for later processing

This foundation gives you a working system that demonstrates the core value proposition: AI-powered bookmark analysis with actionable suggestions. 