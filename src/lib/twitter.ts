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

interface TwitterApiResponse {
  data?: TwitterBookmark[]
  includes?: {
    users?: TwitterUser[]
    media?: Array<{
      media_key: string
      type: string
      url?: string
    }>
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
  }> {
    try {
      // Use the user ID instead of 'me' if provided
      const url = `https://api.twitter.com/2/users/${this.userId}/bookmarks`
      const params = new URLSearchParams({
        'max_results': maxResults.toString(),
        'tweet.fields': 'created_at,author_id,text,attachments,entities',
        'user.fields': 'name,username',
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
      }
    } catch (error) {
      console.error('🐦 Twitter API call failed:', error)
      throw error
    }
  }

  async getTweet(tweetId: string): Promise<TwitterBookmark | null> {
    const url = new URL(`https://api.twitter.com/2/tweets/${tweetId}`)
    url.searchParams.set('tweet.fields', 'created_at,author_id,text,attachments,entities')
    
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
    url.searchParams.set('user.fields', 'name,username')
    
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
} 