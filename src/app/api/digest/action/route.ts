import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return new NextResponse('Invalid token', { status: 400 })
    }

    // Decode the action token
    let userId: string, bookmarkId: string, action: string
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const parts = decoded.split(':')
      
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }
      
      [userId, bookmarkId, action] = parts
    } catch {
      return new NextResponse('Invalid token format', { status: 400 })
    }

    // Validate that the bookmark belongs to the user
    const { data: bookmark, error: bookmarkError } = await supabaseAdmin
      .from('bookmarks')
      .select('id, content, summary, status')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .single()

    if (bookmarkError || !bookmark) {
      return new NextResponse('Bookmark not found', { status: 404 })
    }

    // Handle different actions
    let newStatus: string
    let responseMessage: string

    switch (action) {
      case 'done':
        newStatus = 'done'
        responseMessage = 'Great! Bookmark marked as done. 🎉'
        break
      
      case 'snooze':
        newStatus = 'snoozed'
        responseMessage = 'Bookmark snoozed for 7 days. We\'ll remind you then! ⏰'
        break
      
      case 'view':
        // For view action, redirect to the dashboard with the bookmark highlighted
        const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard?highlight=${bookmarkId}`
        return NextResponse.redirect(dashboardUrl)
      
      default:
        return new NextResponse('Invalid action', { status: 400 })
    }

    // Update bookmark status
    const updateData: { status: string; snooze_until?: string } = { status: newStatus }
    
    if (action === 'snooze') {
      // Set snooze_until to 7 days from now
      const snoozeUntil = new Date()
      snoozeUntil.setDate(snoozeUntil.getDate() + 7)
      updateData.snooze_until = snoozeUntil.toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookmarks')
      .update(updateData)
      .eq('id', bookmarkId)

    if (updateError) {
      console.error('Failed to update bookmark:', updateError)
      return new NextResponse('Failed to update bookmark', { status: 500 })
    }

    // Return a simple HTML page with the success message
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookSpark - Action Complete</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      margin: 20px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    .bookmark-info {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 32px;
      text-align: left;
    }
    .bookmark-summary {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .bookmark-status {
      font-size: 14px;
      color: #6b7280;
    }
    .btn {
      display: inline-block;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin: 0 8px;
    }
    .btn:hover {
      background: #2563eb;
    }
    .btn.secondary {
      background: #6b7280;
    }
    .btn.secondary:hover {
      background: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <div class="title">Action Complete!</div>
    <div class="message">${responseMessage}</div>
    
    <div class="bookmark-info">
      <div class="bookmark-summary">${bookmark.summary || 'Bookmark'}</div>
      <div class="bookmark-status">Status: ${newStatus}</div>
    </div>
    
    <div>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">
        View Dashboard
      </a>
      <a href="mailto:?subject=Check out BookSpark&body=I'm using BookSpark to turn my Twitter bookmarks into actionable outcomes. Check it out at ${process.env.NEXTAUTH_URL}" class="btn secondary">
        Share BookSpark
      </a>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Digest action error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 