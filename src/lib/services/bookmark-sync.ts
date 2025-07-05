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
    const { bookmarks, users, media } = await twitter.getBookmarks()

    // Create lookups for user and media data
    const userLookup = users.reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {} as Record<string, typeof users[0]>)

    const mediaLookup = media.reduce((acc, m) => {
      acc[m.media_key] = m
      return acc
    }, {} as Record<string, typeof media[0]>)

    let processedCount = 0
    let newCount = 0
    let updatedCount = 0

    // Process each bookmark
    for (const bookmark of bookmarks) {
      try {
        const author = userLookup[bookmark.author_id]
        
        // Extract and process URLs
        const extractedUrls = bookmark.entities?.urls || []
        const primaryUrl = extractedUrls.length > 0 ? extractedUrls[0].expanded_url : null
        
        // Process media attachments
        const mediaAttachments = bookmark.attachments?.media_keys?.map(key => {
          const mediaItem = mediaLookup[key]
          if (!mediaItem) return null
          
          return {
            media_key: mediaItem.media_key,
            type: mediaItem.type,
            url: mediaItem.url,
            preview_image_url: mediaItem.preview_image_url,
            width: mediaItem.width,
            height: mediaItem.height,
            duration_ms: mediaItem.duration_ms,
            alt_text: mediaItem.alt_text
          }
        }).filter((item): item is NonNullable<typeof item> => item !== null) || []

        // Clean text by removing URLs for better readability
        const cleanText = TwitterClient.extractCleanText(bookmark.text, bookmark.entities)
        
        // Determine content type based on attachments and URLs
        let contentType = 'tweet'
        if (mediaAttachments.some(m => m && m.type === 'video')) {
          contentType = 'video'
        } else if (mediaAttachments.some(m => m && m.type === 'photo')) {
          contentType = 'image'
        } else if (extractedUrls.length > 0) {
          contentType = 'link'
        }

        // Get high-res profile image
        const authorProfileImage = TwitterClient.getHighResProfileImage(author?.profile_image_url)

        // Check if bookmark already exists
        const { data: existingBookmark } = await supabaseAdmin
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('twitter_id', bookmark.id)
          .single()

        // Store bookmark (upsert to handle duplicates) - use database UUID for user_id
        const bookmarkData = {
          user_id: user.id, // Use database UUID
          twitter_id: bookmark.id,
          content: cleanText || bookmark.text, // Use cleaned text, fallback to original
          author_name: author?.name,
          author_username: author?.username,
          author_profile_image: authorProfileImage,
          author_verified: author?.verified || false,
          url: primaryUrl,
          expanded_urls: extractedUrls.length > 0 ? extractedUrls : null,
          media_attachments: mediaAttachments.length > 0 ? mediaAttachments : null,
          tweet_metrics: bookmark.public_metrics || null,
          content_type: contentType,
          bookmark_created_at: bookmark.created_at,
          status: 'new',
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabaseAdmin
          .from('bookmarks')
          .upsert(bookmarkData, {
            onConflict: 'user_id,twitter_id',
            ignoreDuplicates: false
          })

        if (!insertError) {
          processedCount++
          if (existingBookmark) {
            updatedCount++
          } else {
            newCount++
          }
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

    console.log(`✅ Sync complete for user ${userId}: ${processedCount} processed (${newCount} new, ${updatedCount} updated)`)
    
    return {
      processed: processedCount,
      new: newCount,
      updated: updatedCount
    }
  } catch (error) {
    console.error('❌ Bookmark sync failed:', error)
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

// Helper function to estimate reading time
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200 // Average reading speed
  const wordCount = text.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// Helper function to detect sentiment (basic implementation)
export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'excellent', 'love', 'like', 'best', 'wonderful', 'fantastic']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disgusting', 'disappointing', 'annoying']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
} 