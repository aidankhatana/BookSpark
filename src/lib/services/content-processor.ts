import { supabaseAdmin } from '@/lib/supabase'
import { analyzeContent } from '@/lib/ai/content-analyzer'



export async function processUnanalyzedBookmarks(batchSize = 10) {
  try {
    // Get bookmarks that haven't been processed
    const { data: bookmarks, error } = await supabaseAdmin
      .from('bookmarks')
      .select('id, content, url, user_id')
      .is('processed_at', null)
      .limit(batchSize)

    if (error) {
      throw new Error(`Failed to fetch unprocessed bookmarks: ${error.message}`)
    }

    if (!bookmarks?.length) {
      console.log('No unprocessed bookmarks found')
      return 0
    }

    console.log(`Processing ${bookmarks.length} bookmarks...`)
    let processedCount = 0

    for (const bookmark of bookmarks) {
      try {
        const analysis = await analyzeContent(bookmark.content, bookmark.url)
        
        const { error: updateError } = await supabaseAdmin
          .from('bookmarks')
          .update({
            summary: analysis.summary,
            content_type: analysis.contentType,
            topics: analysis.topics,
            suggested_actions: analysis.suggestedActions,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookmark.id)

        if (updateError) {
          console.error(`Failed to update bookmark ${bookmark.id}:`, updateError)
        } else {
          processedCount++
          console.log(`Processed bookmark ${bookmark.id}: ${analysis.contentType}`)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to process bookmark ${bookmark.id}:`, error)
        
        // Mark as processed with error to avoid reprocessing
        await supabaseAdmin
          .from('bookmarks')
          .update({
            summary: bookmark.content.slice(0, 100) + '...',
            content_type: 'error',
            topics: [],
            suggested_actions: ['Mark as done', 'Try again'],
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookmark.id)
      }
    }

    console.log(`Successfully processed ${processedCount}/${bookmarks.length} bookmarks`)
    return processedCount
  } catch (error) {
    console.error('Batch processing failed:', error)
    throw error
  }
}

export async function processBookmark(bookmarkId: string): Promise<boolean> {
  try {
    const { data: bookmark, error } = await supabaseAdmin
      .from('bookmarks')
      .select('content, url')
      .eq('id', bookmarkId)
      .single()

    if (error || !bookmark) {
      throw new Error('Bookmark not found')
    }

    const analysis = await analyzeContent(bookmark.content, bookmark.url)
    
    const { error: updateError } = await supabaseAdmin
      .from('bookmarks')
      .update({
        summary: analysis.summary,
        content_type: analysis.contentType,
        topics: analysis.topics,
        suggested_actions: analysis.suggestedActions,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookmarkId)

    if (updateError) {
      throw updateError
    }

    return true
  } catch (error) {
    console.error(`Failed to process bookmark ${bookmarkId}:`, error)
    return false
  }
}

export async function reprocessBookmark(bookmarkId: string): Promise<boolean> {
  try {
    // Reset processed_at to null first
    await supabaseAdmin
      .from('bookmarks')
      .update({
        processed_at: null,
        summary: null,
        content_type: 'tweet',
        topics: [],
        suggested_actions: [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookmarkId)

    // Then process it
    return await processBookmark(bookmarkId)
  } catch (error) {
    console.error(`Failed to reprocess bookmark ${bookmarkId}:`, error)
    return false
  }
} 