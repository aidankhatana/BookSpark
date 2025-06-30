import { supabaseAdmin } from '@/lib/supabase'
import { TwitterClient } from '@/lib/twitter'

export async function syncUserBookmarks(userId: string) {
  try {
    // Get user's Twitter token - look up by twitter_id since session user.id is Twitter ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, twitter_id, twitter_token, last_sync_at')
      .eq('twitter_id', userId)
      .single()

    if (userError || !user?.twitter_token) {
      throw new Error('No Twitter token found for user')
    }

    // Pass the Twitter user ID to the client
    const twitter = new TwitterClient(user.twitter_token, user.twitter_id)
    const { bookmarks, users } = await twitter.getBookmarks()

    // Create a lookup for user data
    const userLookup = users.reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {} as Record<string, typeof users[0]>)

    let processedCount = 0

    // Process each bookmark
    for (const bookmark of bookmarks) {
      try {
        const author = userLookup[bookmark.author_id]
        
        // Extract URL if present
        let extractedUrl = null
        if (bookmark.entities?.urls?.length) {
          extractedUrl = bookmark.entities.urls[0].expanded_url
        }

        // Store bookmark (upsert to handle duplicates) - use database UUID for user_id
        const { error: insertError } = await supabaseAdmin
          .from('bookmarks')
          .upsert({
            user_id: user.id, // Use database UUID
            twitter_id: bookmark.id,
            content: bookmark.text,
            author_name: author?.name,
            author_username: author?.username,
            url: extractedUrl,
            bookmark_created_at: bookmark.created_at,
            status: 'new',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,twitter_id',
            ignoreDuplicates: false
          })

        if (!insertError) {
          processedCount++
        } else {
          console.error(`Failed to store bookmark ${bookmark.id}:`, insertError)
        }
      } catch (error) {
        console.error(`Error processing bookmark ${bookmark.id}:`, error)
      }
    }

    // Update last sync time - use database UUID
    await supabaseAdmin
      .from('users')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', user.id)

    console.log(`Synced ${processedCount} bookmarks for user ${userId}`)
    return processedCount
  } catch (error) {
    console.error('Bookmark sync failed:', error)
    throw error
  }
}

export async function getUnprocessedBookmarks(limit = 50) {
  const { data: bookmarks, error } = await supabaseAdmin
    .from('bookmarks')
    .select('*')
    .is('processed_at', null)
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch unprocessed bookmarks: ${error.message}`)
  }

  return bookmarks || []
} 