import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { digestGenerator } from '@/lib/services/digest-generator'
import { authOptions } from '@/lib/auth-config'

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
    const { userId, sendToAll } = body

    if (sendToAll) {
      // Send digests to all users (admin functionality)
      const result = await digestGenerator.generateDigestForAllUsers()
      return NextResponse.json({
        success: true,
        message: `Digest batch complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`,
        stats: result,
      })
    } else {
      // Send digest to specific user (or current user)
      const targetUserId = userId || session.user.id
      const result = await digestGenerator.generateAndSendDigest(targetUserId)
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
      })
    }
  } catch (error) {
    console.error('Digest send error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send digest' },
      { status: 500 }
    )
  }
}

// Test endpoint for development
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Send a test digest to the current user
    const result = await digestGenerator.generateAndSendDigest(session.user.id)
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
    })
  } catch (error) {
    console.error('Test digest error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send test digest' },
      { status: 500 }
    )
  }
} 