/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to get database user by Twitter ID
async function getDatabaseUser(twitterId: string) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('twitter_id', twitterId)
    .single()
  
  if (error || !user) {
    throw new Error('User not found in database')
  }
  
  return user
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    const dbUser = await getDatabaseUser(sessionUser.id) // Get database UUID
    
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'new'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = supabaseAdmin
      .from('bookmarks')
      .select('*')
      .eq('user_id', dbUser.id) // Use database UUID
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Filter by status if provided
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: bookmarks, error } = await query
    
    if (error) {
      throw new Error(`Failed to fetch bookmarks: ${error.message}`)
    }
    
    return NextResponse.json({ 
      success: true,
      bookmarks: bookmarks || [],
      count: bookmarks?.length || 0
    })
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookmarks' 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    const dbUser = await getDatabaseUser(sessionUser.id) // Get database UUID
    
    const body = await request.json()
    const { bookmarkId, status, snoozeUntil } = body
    
    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }
    
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (status) {
      updateData.status = status
    }
    
    if (snoozeUntil) {
      updateData.snooze_until = snoozeUntil
      updateData.status = 'snoozed'
    }
    
    const { error } = await supabaseAdmin
      .from('bookmarks')
      .update(updateData)
      .eq('id', bookmarkId)
      .eq('user_id', dbUser.id) // Use database UUID
    
    if (error) {
      throw new Error(`Failed to update bookmark: ${error.message}`)
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Bookmark updated successfully'
    })
  } catch (error) {
    console.error('Failed to update bookmark:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bookmark' 
      },
      { status: 500 }
    )
  }
} 