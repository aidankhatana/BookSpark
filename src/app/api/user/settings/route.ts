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
      .select('digest_enabled, digest_time, timezone, email')
      .eq('twitter_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user settings:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch settings: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: {
        digest_enabled: user.digest_enabled ?? true,
        digest_time: user.digest_time ?? '08:00:00',
        timezone: user.timezone ?? 'UTC',
        email: user.email || ''
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
    console.log('Update request body:', body)
    
    const { digest_enabled, digest_time, timezone, email } = body

    // Validate the input
    if (digest_enabled !== undefined && typeof digest_enabled !== 'boolean') {
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

    // Validate email format if provided
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Prepare update data with proper typing
    const updateData: {
      digest_enabled?: boolean
      digest_time?: string
      timezone?: string
      email?: string | null
      updated_at: string
    } = {
      updated_at: new Date().toISOString()
    }

    // Only update fields that are provided
    if (digest_enabled !== undefined) {
      updateData.digest_enabled = digest_enabled
    }
    if (digest_time) {
      updateData.digest_time = digest_time
    }
    if (timezone) {
      updateData.timezone = timezone
    }
    if (email !== undefined) {
      updateData.email = email.trim() || null
    }

    console.log('Updating user settings:', updateData)
    console.log('For user ID:', session.user.id)

    // Update user settings in database
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('twitter_id', session.user.id)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('No user found with twitter_id:', session.user.id)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Settings updated successfully for user:', session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 