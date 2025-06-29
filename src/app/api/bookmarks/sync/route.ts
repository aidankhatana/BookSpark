import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { syncUserBookmarks } from '@/lib/services/bookmark-sync'
import { processUnanalyzedBookmarks } from '@/lib/services/content-processor'

export async function POST() {
  try {
    const user = await requireAuth()
    
    console.log(`Starting bookmark sync for user ${user.id}`)
    
    // Sync bookmarks from Twitter
    const syncedCount = await syncUserBookmarks(user.id)
    
    // Process any unanalyzed bookmarks
    const processedCount = await processUnanalyzedBookmarks(10)
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedCount} bookmarks, processed ${processedCount} with AI`,
      syncedCount,
      processedCount
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