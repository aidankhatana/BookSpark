# BookSpark Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Twitter API
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Getting API Keys

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your URL and anon key

### Twitter API
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a new app
3. Enable OAuth 2.0
4. Add `http://localhost:3000/api/auth/callback/twitter` as redirect URL
5. Request `users.read`, `bookmark.read`, `tweet.read`, and `offline.access` scopes

### OpenAI API
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add billing information

## Database Setup

Run the SQL commands in `database/schema.sql` in your Supabase SQL editor.

## Development

```bash
npm run dev
``` 