import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { emailService } from '@/lib/services/email-service'
import { authOptions } from '@/lib/auth-config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user email from session or URL params
    const { searchParams } = new URL(req.url)
    const testEmail = searchParams.get('email') || session.user.email

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address found' },
        { status: 400 }
      )
    }

    console.log(`🧪 Sending test digest to ${testEmail}`)

    // Send test digest
    const success = await emailService.sendTestDigest(testEmail, session.user.name || 'BookSpark User')

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test digest sent successfully to ${testEmail}`,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send test digest' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test digest error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send test digest' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { email, name } = body

    const testEmail = email || session.user.email
    const testName = name || session.user.name || 'BookSpark User'

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Sending custom test digest to ${testEmail}`)

    const success = await emailService.sendTestDigest(testEmail, testName)

    return NextResponse.json({
      success,
      message: success 
        ? `Test digest sent to ${testEmail}` 
        : 'Failed to send test digest',
    })
  } catch (error) {
    console.error('Custom test digest error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send test digest' },
      { status: 500 }
    )
  }
} 