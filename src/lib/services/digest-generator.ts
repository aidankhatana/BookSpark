import { supabaseAdmin } from '@/lib/supabase'
import { emailService } from './email-service'

interface User {
  id: string
  twitter_id: string
  name: string
  email: string
  digest_time: string
  digest_enabled: boolean
  last_digest_sent: string | null
}

interface Bookmark {
  id: string
  content: string
  summary: string
  author_name: string
  author_username: string
  topics: string[]
  suggested_actions: string[]
  content_type: string
  status: string
  created_at: string
  processed_at: string
}

export class DigestGenerator {
  private async selectBookmarksForDigest(userId: string, limit = 5): Promise<Bookmark[]> {
    // Get bookmarks that are:
    // 1. New or pending status
    // 2. Processed by AI (have summaries)
    // 3. Created in the last 7 days (to keep content fresh)
    // 4. Prioritize by recency and engagement potential

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: bookmarks, error } = await supabaseAdmin
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['new', 'pending'])
      .not('summary', 'is', null)
      .not('processed_at', 'is', null)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more than we need for selection logic

    if (error) {
      console.error('Failed to fetch bookmarks for digest:', error)
      return []
    }

    if (!bookmarks || bookmarks.length === 0) {
      return []
    }

    // Selection algorithm: prioritize diversity and actionability
    const selectedBookmarks: Bookmark[] = []
    const usedTopics = new Set<string>()
    const contentTypes = new Set<string>()

    // First pass: select bookmarks with diverse topics and content types
    for (const bookmark of bookmarks) {
      if (selectedBookmarks.length >= limit) break

      const hasNewTopic = bookmark.topics?.some((topic: string) => !usedTopics.has(topic))
      const hasNewContentType = !contentTypes.has(bookmark.content_type)
      const hasActions = bookmark.suggested_actions?.length > 0

      // Prioritize bookmarks with:
      // - New topics not yet included
      // - Different content types
      // - Clear action suggestions
      if ((hasNewTopic || hasNewContentType || selectedBookmarks.length < 2) && hasActions) {
        selectedBookmarks.push(bookmark)
        bookmark.topics?.forEach((topic: string) => usedTopics.add(topic))
        contentTypes.add(bookmark.content_type)
      }
    }

    // Second pass: fill remaining slots with best remaining bookmarks
    for (const bookmark of bookmarks) {
      if (selectedBookmarks.length >= limit) break
      
      if (!selectedBookmarks.find(b => b.id === bookmark.id)) {
        selectedBookmarks.push(bookmark)
      }
    }

    return selectedBookmarks.slice(0, limit)
  }

  private async shouldSendDigest(user: User): Promise<boolean> {
    // Check if user has digest enabled
    if (!user.digest_enabled) {
      return false
    }

    // Check if we've already sent a digest today
    if (user.last_digest_sent) {
      const lastSent = new Date(user.last_digest_sent)
      const today = new Date()
      
      // If last digest was sent today, don't send another
      if (lastSent.toDateString() === today.toDateString()) {
        return false
      }
    }

    // Check if it's the right time based on user's preferred digest time
    const now = new Date()
    const currentHour = now.getHours()
    const [digestHour] = user.digest_time.split(':').map(Number)

    // Send digest within 1 hour window of user's preferred time
    return Math.abs(currentHour - digestHour) <= 1
  }

  private generateUnsubscribeUrl(userId: string): string {
    const token = Buffer.from(`unsubscribe:${userId}:${Date.now()}`).toString('base64')
    return `${process.env.NEXTAUTH_URL}/api/digest/unsubscribe?token=${token}`
  }

  async generateAndSendDigest(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get user information
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, twitter_id, name, email, digest_time, digest_enabled, last_digest_sent')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return { success: false, message: 'User not found' }
      }

      // Check if we should send digest
      if (!await this.shouldSendDigest(user)) {
        return { success: true, message: 'Digest not due or disabled' }
      }

      // Get bookmarks for digest
      const bookmarks = await this.selectBookmarksForDigest(userId)

      if (bookmarks.length === 0) {
        // Update last_digest_sent even if no bookmarks to avoid checking again today
        await supabaseAdmin
          .from('users')
          .update({ last_digest_sent: new Date().toISOString() })
          .eq('id', userId)

        return { success: true, message: 'No bookmarks to send' }
      }

      // Send digest email
      const emailData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        bookmarks: bookmarks.map(b => ({
          id: b.id,
          content: b.content,
          summary: b.summary,
          author_name: b.author_name,
          author_username: b.author_username,
          topics: b.topics || [],
          suggested_actions: b.suggested_actions || [],
          content_type: b.content_type,
          created_at: b.created_at,
        })),
        unsubscribeUrl: this.generateUnsubscribeUrl(userId),
      }

      const emailSent = await emailService.sendDailyDigest(emailData)

      if (emailSent) {
        // Update last_digest_sent timestamp
        await supabaseAdmin
          .from('users')
          .update({ last_digest_sent: new Date().toISOString() })
          .eq('id', userId)

        // Update bookmark statuses to 'pending' (they've been sent in digest)
        await supabaseAdmin
          .from('bookmarks')
          .update({ status: 'pending' })
          .in('id', bookmarks.map(b => b.id))

        return { 
          success: true, 
          message: `Digest sent successfully with ${bookmarks.length} bookmarks` 
        }
      } else {
        return { success: false, message: 'Failed to send digest email' }
      }
    } catch (error) {
      console.error('Failed to generate digest:', error)
      return { success: false, message: 'Internal error generating digest' }
    }
  }

  async generateDigestForAllUsers(): Promise<{ sent: number; failed: number; skipped: number }> {
    let sent = 0
    let failed = 0
    let skipped = 0

    try {
      // Get all users with digest enabled
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, twitter_id, name, email, digest_time, digest_enabled, last_digest_sent')
        .eq('digest_enabled', true)

      if (error || !users) {
        console.error('Failed to fetch users for digest:', error)
        return { sent: 0, failed: 1, skipped: 0 }
      }

      console.log(`🔄 Processing digests for ${users.length} users`)

      // Process each user
      for (const user of users) {
        try {
          const result = await this.generateAndSendDigest(user.id)
          
          if (result.success) {
            if (result.message.includes('sent successfully')) {
              sent++
              console.log(`✅ Digest sent to ${user.email}`)
            } else {
              skipped++
              console.log(`⏭️ Skipped ${user.email}: ${result.message}`)
            }
          } else {
            failed++
            console.error(`❌ Failed for ${user.email}: ${result.message}`)
          }

          // Small delay to avoid overwhelming email service
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          failed++
          console.error(`❌ Error processing ${user.email}:`, error)
        }
      }

      console.log(`📊 Digest batch complete: ${sent} sent, ${failed} failed, ${skipped} skipped`)
      return { sent, failed, skipped }
    } catch (error) {
      console.error('❌ Fatal error in digest generation:', error)
      return { sent: 0, failed: 1, skipped: 0 }
    }
  }
}

export const digestGenerator = new DigestGenerator() 