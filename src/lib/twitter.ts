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
      const errorText = await response.text()
      throw new Error(`Twitter API error: ${response.status} - ${errorText}`)
    }

    const data: TwitterApiResponse = await response.json()
    
    return {
      bookmarks: data.data || [],
      users: data.includes?.users || [],
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