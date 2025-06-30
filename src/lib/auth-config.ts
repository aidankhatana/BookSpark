/* eslint-disable @typescript-eslint/no-explicit-any */
import TwitterProvider from 'next-auth/providers/twitter'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || 'placeholder',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || 'placeholder',
      version: '2.0',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'users.read bookmark.read tweet.read offline.access',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'twitter') {
        try {
          // Log OAuth details for debugging Twitter API issues
          console.log('🔑 OAuth scopes received:', account.scope)
          
          // Get Twitter ID from the right place
          const twitterId = profile?.data?.id || profile?.id || user?.id || account?.providerAccountId
          const twitterUsername = profile?.data?.username || profile?.username || profile?.screen_name
          
          if (!twitterId) {
            console.error('❌ No Twitter ID found in profile, user, or account')
            return false
          }
          
          // Store user in Supabase
          const { data, error } = await supabaseAdmin
            .from('users')
            .upsert({
              twitter_id: twitterId,
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              twitter_username: twitterUsername,
              twitter_token: account.access_token,
              twitter_refresh_token: account.refresh_token,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'twitter_id'
            })
            .select()
            .single()

          if (error) {
            console.error('❌ Error storing user:', error)
            return false
          }
          
          console.log('✅ User stored successfully:', data?.twitter_id)
          return true
        } catch (error) {
          console.error('❌ SignIn error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }: any) {
      // Use Twitter ID as the session user ID
      if (token.twitter_id) {
        session.user.id = token.twitter_id
        session.user.twitter_username = token.twitter_username
      }
      return session
    },
    async jwt({ token, account, profile }: any) {
      // Store Twitter info in JWT
      if (account && profile) {
        const twitterId = profile?.data?.id || profile?.id || account?.providerAccountId
        token.twitter_id = twitterId
        token.twitter_username = profile?.data?.username || profile?.username || profile?.screen_name
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
} 