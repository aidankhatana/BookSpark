import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user settings from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('digest_enabled, digest_time, timezone')
      .eq('twitter_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: {
        digest_enabled: user.digest_enabled ?? true,
        digest_time: user.digest_time ?? '08:00:00',
        timezone: user.timezone ?? 'UTC'
      }
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { digest_enabled, digest_time, timezone } = body

    // Validate the input
    if (typeof digest_enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'digest_enabled must be a boolean' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM:SS)
    if (digest_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(digest_time)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time format' },
        { status: 400 }
      )
    }

    // Update user settings in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        digest_enabled,
        digest_time: digest_time || '08:00:00',
        timezone: timezone || 'UTC',
        updated_at: new Date().toISOString()
      })
      .eq('twitter_id', session.user.id)

    if (error) {
      console.error('Error updating user settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 