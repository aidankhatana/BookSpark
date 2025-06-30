# BookSpark Setup Guide

Follow these steps to set up BookSpark with all required services. Everything is **free** to get started!

## 🚀 Quick Setup

1. **Clone and install dependencies**
   ```bash
   cd BookSpark
   npm install
   ```

2. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in API keys** (see detailed instructions below)

4. **Set up database** (run SQL commands in Supabase)

5. **Start development**
   ```bash
   npm run dev
   ```

---

## 🔧 Service Setup (Step by Step)

### 1. 🗄️ Supabase Database (Free)

**Create Account & Project:**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up with GitHub
3. Click "New Project"
4. Choose organization → Name your project "bookspark"
5. Generate a strong password
6. Select region closest to you
7. Click "Create new project" (takes ~2 minutes)

**Get API Keys:**
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values to your `.env.local`:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

**Set Up Database:**
1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database/schema.sql`
4. Click "Run" to create all tables and policies

### 2. 🐦 Twitter API (Free)

**Get Twitter Developer Access:**
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Click "Apply for a developer account"
3. Select "Making a bot" → Answer questions about your use case
4. Verify your email and phone number
5. Wait for approval (usually instant to a few hours)

**Create App:**
1. In Twitter Developer Portal, click "Create App"
2. Give it a name like "BookSpark Local Dev"
3. Once created, go to your app settings

**Set Up OAuth 2.0:**
1. Go to app **Settings** → **User authentication settings**
2. Click "Edit"
3. Enable **OAuth 2.0**
4. **App permissions**: Read and write
5. **Type of App**: Web App
6. **Callback URLs**: `http://localhost:3000/api/auth/callback/twitter`
7. **Website URL**: `http://localhost:3000`
8. **Terms of Service**: `http://localhost:3000` (for dev)
9. **Privacy Policy**: `http://localhost:3000` (for dev)
10. Click "Save"

**Get API Keys:**
1. Go to **Keys and tokens** tab
2. Copy these to your `.env.local`:
   ```bash
   TWITTER_CLIENT_ID=your_oauth2_client_id
   TWITTER_CLIENT_SECRET=your_oauth2_client_secret
   ```

### 3. 🤖 Google AI / Gemini (Free)

**Create API Key:**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get started" → "Get API key"
3. Sign in with Google account
4. Click "Create API key"
5. Copy the key to your `.env.local`:
   ```bash
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   ```

**Free Limits:**
- 15 requests per minute
- 1 million tokens per minute  
- 1,500 requests per day
- Perfect for development and testing!

### 4. 📧 Email Service - Resend (Free)

**Create Account:**
1. Go to [resend.com](https://resend.com)
2. Sign up with email or GitHub
3. Verify your email address

**Get API Key:**
1. In Resend dashboard, go to **API Keys**
2. Click "Create API Key"
3. Name it "BookSpark Development"
4. Copy the key to your `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_resend_api_key_here
   ```

**Free Limits:**
- 3,000 emails per month
- 100 emails per day
- Perfect for development and initial users!

**Domain Setup (Optional):**
- For production, add your custom domain
- For development, you can send from "digest@bookspark.app"

### 5. 🔐 NextAuth Configuration

**Generate Secret:**
```bash
# Generate a random secret
openssl rand -base64 32
```

**Add to .env.local:**
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here
```

---

## 📝 Complete .env.local Example

```bash
# Database (Supabase)
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-32-char-string-here

# Twitter API v2
TWITTER_CLIENT_ID=your_twitter_oauth2_client_id
TWITTER_CLIENT_SECRET=your_twitter_oauth2_client_secret

# Google Gemini AI (Free)
GOOGLE_AI_API_KEY=AIzaSyC_your_google_ai_api_key_here

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Environment
NODE_ENV=development
```

---

## 🧪 Test Your Setup

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Visit:** [http://localhost:3000](http://localhost:3000)

3. **Sign in with Twitter** - Should redirect to Twitter OAuth

4. **Check database** - User should appear in Supabase `users` table

5. **Sync bookmarks** - Click "Sync Bookmarks" button

6. **Check AI processing** - Bookmarks should get summaries and action suggestions

7. **Test email digest** - Visit `/api/digest/test` to send a test email

---

## 🎯 Verification Checklist

- [ ] Supabase project created and database schema loaded
- [ ] Twitter Developer account approved and OAuth app configured  
- [ ] Google AI API key generated
- [ ] Resend account created and API key configured
- [ ] All environment variables in `.env.local`
- [ ] `npm run dev` starts without errors
- [ ] Can sign in with Twitter successfully
- [ ] Bookmarks sync from Twitter
- [ ] AI analysis generates summaries and actions
- [ ] Test digest email sends successfully

---

## 🆘 Common Issues

**Twitter OAuth Error:**
- Double-check callback URL: `http://localhost:3000/api/auth/callback/twitter`
- Ensure OAuth 2.0 is enabled, not OAuth 1.0a
- Verify app permissions include "Read and write"

**Database Connection Error:**
- Check Supabase URL doesn't end with `/`
- Verify API keys are from the correct project
- Make sure you ran the SQL schema file

**AI Processing Failing:**
- Verify Google AI API key is correct
- Check quota limits in Google AI Studio
- Look for errors in browser console

**Build Errors:**
- Clear Next.js cache: `rm -rf .next`

**Email Digest Issues:**
- Verify Resend API key is correct
- Check your email spam folder
- Ensure you have bookmarks synced before testing digest
- For production, verify domain authentication in Resend
- Reinstall dependencies: `rm -rf node_modules && npm install`

---

## 🚀 Ready to Deploy?

Once everything works locally:

1. **Vercel (Recommended):**
   - Connect GitHub repo to Vercel
   - Add all environment variables in Vercel dashboard
   - Update `NEXTAUTH_URL` to your production domain

2. **Update Twitter OAuth:**
   - Add production callback URL to Twitter app
   - Update website URLs to production domain

3. **Production Database:**
   - Your Supabase database works in production automatically!

**That's it! You now have a fully functional BookSpark instance! 🎉** 