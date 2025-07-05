import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { syncUserBookmarks } from '@/lib/services/bookmark-sync'
import { processUnanalyzedBookmarks } from '@/lib/services/content-processor'

export async function POST() {
  try {
    const user = await requireAuth()
    
    console.log(`Starting bookmark sync for user ${user.id}`)
    
    // Sync bookmarks from Twitter
    const syncResult = await syncUserBookmarks(user.id)
    
    // Process any unanalyzed bookmarks
    const processedCount = await processUnanalyzedBookmarks(10)
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncResult.processed} bookmarks (${syncResult.new} new, ${syncResult.updated} updated), processed ${processedCount} with AI`,
      processed: syncResult.processed,
      new: syncResult.new,
      updated: syncResult.updated,
      aiProcessed: processedCount
    })
  } catch (error) {
    console.error('Bookmark sync failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      },
      { status: 500 }
    )
  }
} 