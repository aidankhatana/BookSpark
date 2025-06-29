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
          // Store user in Supabase
          const { error } = await supabaseAdmin
            .from('users')
            .upsert({
              id: user.id,
              twitter_id: profile.id,
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              twitter_username: profile.username,
              twitter_token: account.access_token,
              twitter_refresh_token: account.refresh_token,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) {
            console.error('Error storing user:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('SignIn error:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }: any) {
      // Add user ID to session
      session.user.id = token.sub
      return session
    },
    async jwt({ token, account, profile }: any) {
      // Store additional info in JWT if needed
      if (account && profile) {
        token.twitter_id = profile.id
        token.twitter_username = profile.username
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
} 