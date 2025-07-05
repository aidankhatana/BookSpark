interface TwitterBookmark {
  id: string
  text: string
  author_id: string
  created_at: string
  public_metrics?: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
  attachments?: {
    media_keys?: string[]
  }
  entities?: {
    urls?: Array<{
      start: number
      end: number
      url: string
      expanded_url: string
      display_url: string
      unwound_url?: string
      title?: string
      description?: string
    }>
    hashtags?: Array<{
      start: number
      end: number
      tag: string
    }>
    mentions?: Array<{
      start: number
      end: number
      username: string
      id: string
    }>
  }
}

interface TwitterUser {
  id: string
  name: string
  username: string
  profile_image_url?: string
  verified?: boolean
  description?: string
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

interface TwitterMedia {
  media_key: string
  type: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
  width?: number
  height?: number
  duration_ms?: number
  alt_text?: string
}

interface TwitterApiResponse {
  data?: TwitterBookmark[]
  includes?: {
    users?: TwitterUser[]
    media?: TwitterMedia[]
  }
  meta?: {
    result_count: number
    next_token?: string
  }
}

export class TwitterClient {
  private accessToken: string
  private userId: string

  constructor(accessToken: string, userId?: string) {
    this.accessToken = accessToken
    this.userId = userId || 'me'
  }

  async getBookmarks(maxResults = 100): Promise<{
    bookmarks: TwitterBookmark[]
    users: TwitterUser[]
    media: TwitterMedia[]
  }> {
    try {
      // Use the user ID instead of 'me' if provided
      const url = `https://api.twitter.com/2/users/${this.userId}/bookmarks`
      const params = new URLSearchParams({
        'max_results': maxResults.toString(),
        'tweet.fields': 'created_at,author_id,text,attachments,entities,public_metrics',
        'user.fields': 'name,username,profile_image_url,verified,description,public_metrics',
        'media.fields': 'type,url,preview_image_url,width,height,duration_ms,alt_text',
        'expansions': 'author_id,attachments.media_keys'
      })

      console.log('🐦 Making Twitter API call:', `${url}?${params.toString()}`)
      
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('🐦 Twitter API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('🐦 Twitter API error response:', errorText)
        throw new Error(`Twitter API error: ${response.status} - ${errorText}`)
      }

      const data: TwitterApiResponse = await response.json()
      console.log('🐦 Twitter API response data:', JSON.stringify(data, null, 2))
      
      return {
        bookmarks: data.data || [],
        users: data.includes?.users || [],
        media: data.includes?.media || []
      }
    } catch (error) {
      console.error('🐦 Twitter API call failed:', error)
      throw error
    }
  }

  async getTweet(tweetId: string): Promise<TwitterBookmark | null> {
    const url = new URL(`https://api.twitter.com/2/tweets/${tweetId}`)
    url.searchParams.set('tweet.fields', 'created_at,author_id,text,attachments,entities,public_metrics')
    url.searchParams.set('user.fields', 'name,username,profile_image_url,verified')
    url.searchParams.set('media.fields', 'type,url,preview_image_url,width,height')
    url.searchParams.set('expansions', 'author_id,attachments.media_keys')
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch tweet ${tweetId}: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.data
  }

  async getUser(userId: string): Promise<TwitterUser | null> {
    const url = new URL(`https://api.twitter.com/2/users/${userId}`)
    url.searchParams.set('user.fields', 'name,username,profile_image_url,verified,description,public_metrics')
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch user ${userId}: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.data
  }

  // Helper method to extract clean text by removing URLs
  static extractCleanText(text: string, entities?: TwitterBookmark['entities']): string {
    if (!entities?.urls) return text
    
    let cleanText = text
    // Sort URLs by start position in reverse order to avoid index shifting
    const sortedUrls = [...entities.urls].sort((a, b) => b.start - a.start)
    
    for (const url of sortedUrls) {
      cleanText = cleanText.slice(0, url.start) + cleanText.slice(url.end)
    }
    
    return cleanText.trim()
  }

  // Helper method to get high-res profile image
  static getHighResProfileImage(profileImageUrl?: string): string | undefined {
    if (!profileImageUrl) return undefined
    // Replace _normal with _400x400 for higher resolution
    return profileImageUrl.replace('_normal', '_400x400')
  }
} 