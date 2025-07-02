import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface DigestBookmark {
  id: string
  content: string
  summary: string
  author_name: string
  author_username: string
  topics: string[]
  suggested_actions: string[]
  content_type: string
  created_at: string
}

interface DigestEmailData {
  user: {
    id: string
    name: string
    email: string
  }
  bookmarks: DigestBookmark[]
  unsubscribeUrl: string
}

export class EmailService {
  private generateActionLink(userId: string, bookmarkId: string, action: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const token = Buffer.from(`${userId}:${bookmarkId}:${action}`).toString('base64')
    return `${baseUrl}/api/digest/action?token=${token}`
  }

  private generateDigestHtml(data: DigestEmailData): string {
    const { bookmarks, unsubscribeUrl } = data

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily BookSpark Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; margin-bottom: 24px; color: #1f2937; }
    .bookmark { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fafafa; }
    .bookmark-header { display: flex; align-items: center; margin-bottom: 12px; }
    .author { color: #6b7280; font-size: 14px; }
    .summary { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; line-height: 1.5; }
    .content-preview { color: #4b5563; font-size: 14px; margin-bottom: 16px; line-height: 1.5; }
    .topics { margin-bottom: 16px; }
    .topic { display: inline-block; background: #ddd6fe; color: #5b21b6; padding: 4px 8px; border-radius: 6px; font-size: 12px; margin-right: 6px; margin-bottom: 4px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .action-btn { display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
    .action-btn:hover { background: #2563eb; }
    .action-btn.secondary { background: #6b7280; }
    .action-btn.secondary:hover { background: #4b5563; }
    .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #f9fafb; }
    .footer p { margin: 8px 0; color: #6b7280; font-size: 14px; }
    .footer a { color: #3b82f6; text-decoration: none; }
    .stats { background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
    .stats-number { font-size: 24px; font-weight: 700; color: #1d4ed8; }
    .stats-label { color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 BookSpark</h1>
      <p>Your daily dose of saved wisdom</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Good morning, ${data.user.name}! 👋
      </div>
      
      <div class="stats">
        <div class="stats-number">${bookmarks.length}</div>
        <div class="stats-label">bookmarks ready for action today</div>
      </div>
      
             ${bookmarks.map(bookmark => `
         <div class="bookmark">
           <div class="bookmark-header">
             <span class="author">@${bookmark.author_username || bookmark.author_name}</span>
           </div>
           
           <div class="summary">${bookmark.summary}</div>
           
           <div class="content-preview">
             ${bookmark.content.length > 150 ? bookmark.content.substring(0, 150) + '...' : bookmark.content}
           </div>
           
           ${bookmark.topics.length > 0 ? `
             <div class="topics">
               ${bookmark.topics.map(topic => `<span class="topic">${topic}</span>`).join('')}
             </div>
           ` : ''}
           
           <div class="actions">
             <a href="${this.generateActionLink(data.user.id, bookmark.id, 'done')}" class="action-btn">✅ Mark Done</a>
             <a href="${this.generateActionLink(data.user.id, bookmark.id, 'snooze')}" class="action-btn secondary">⏰ Snooze 7 days</a>
             <a href="${this.generateActionLink(data.user.id, bookmark.id, 'view')}" class="action-btn secondary">👀 View</a>
           </div>
         </div>
       `).join('')}
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View All Bookmarks
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you have BookSpark digest emails enabled.</p>
      <p>
        <a href="${unsubscribeUrl}">Unsubscribe</a> | 
        <a href="${process.env.NEXTAUTH_URL}/settings">Email Preferences</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px;">
        BookSpark - Turn your bookmarks into actionable outcomes
      </p>
    </div>
  </div>
</body>
</html>`
  }

  private generateDigestText(data: DigestEmailData): string {
    const { bookmarks } = data

    return `
BookSpark Daily Digest - ${new Date().toLocaleDateString()}

Hello ${data.user.name}!

You have ${bookmarks.length} bookmarks ready for action today:

${bookmarks.map((bookmark, index) => `
${index + 1}. ${bookmark.summary}
   From: @${bookmark.author_username || bookmark.author_name}
   Topics: ${bookmark.topics.join(', ') || 'None'}
   
   Quick Actions:
   - Mark Done: ${this.generateActionLink(data.user.id, bookmark.id, 'done')}
   - Snooze: ${this.generateActionLink(data.user.id, bookmark.id, 'snooze')}
   - View: ${this.generateActionLink(data.user.id, bookmark.id, 'view')}

`).join('')}

View all bookmarks: ${process.env.NEXTAUTH_URL}/dashboard

---
BookSpark - Turn your bookmarks into actionable outcomes
Unsubscribe: ${data.unsubscribeUrl}
`
  }

  async sendDailyDigest(data: DigestEmailData): Promise<boolean> {
    try {
      const { user, bookmarks } = data

      if (bookmarks.length === 0) {
        console.log(`No bookmarks to send for user ${user.id}`)
        return true // Not an error, just nothing to send
      }

      const result = await resend.emails.send({
        from: 'BookSpark <digest@bookspark.app>',
        to: user.email,
        subject: `📚 Your Daily BookSpark Digest - ${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'} ready`,
        html: this.generateDigestHtml(data),
        text: this.generateDigestText(data),
        headers: {
          'List-Unsubscribe': `<${data.unsubscribeUrl}>`,
        },
      })

      console.log(`✅ Digest sent to ${user.email}:`, result.data?.id)
      return true
    } catch (error) {
      console.error(`❌ Failed to send digest to ${data.user.email}:`, error)
      return false
    }
  }

  async sendTestDigest(userEmail: string, userName: string): Promise<boolean> {
    try {
      const testBookmarks: DigestBookmark[] = [
        {
          id: 'test-1',
          content: 'Just shipped a new feature using Next.js 15! The app directory is incredibly powerful for building modern web applications.',
          summary: 'Developer shares excitement about Next.js 15 app directory features',
          author_name: 'Sarah Chen',
          author_username: 'sarahcodes',
          topics: ['development', 'nextjs', 'web'],
          suggested_actions: ['Add to learning list', 'Try Next.js 15', 'Follow up on app directory'],
          content_type: 'tweet',
          created_at: new Date().toISOString(),
        },
        {
          id: 'test-2',
          content: 'The key to productivity is not working harder, but working on the right things. Focus beats speed every time.',
          summary: 'Productivity insight about focusing on the right priorities',
          author_name: 'Alex Morgan',
          author_username: 'alexproductivity',
          topics: ['productivity', 'focus', 'mindset'],
          suggested_actions: ['Reflect on current priorities', 'Create focus framework', 'Share with team'],
          content_type: 'tweet',
          created_at: new Date().toISOString(),
        },
      ]

      const testData: DigestEmailData = {
        user: {
          id: 'test-user',
          name: userName,
          email: userEmail,
        },
        bookmarks: testBookmarks,
        unsubscribeUrl: `${process.env.NEXTAUTH_URL}/unsubscribe?token=test`,
      }

      return await this.sendDailyDigest(testData)
    } catch (error) {
      console.error('Failed to send test digest:', error)
      return false
    }
  }
}

export const emailService = new EmailService() 