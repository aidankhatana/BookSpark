-- BookSpark Database Schema

-- Enable Row Level Security
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS actions ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_id TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  twitter_username TEXT,
  twitter_token TEXT,
  twitter_refresh_token TEXT,
  digest_time TIME DEFAULT '08:00:00',
  digest_frequency TEXT DEFAULT 'daily',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  twitter_id TEXT, -- Original tweet ID
  content TEXT NOT NULL,
  author_name TEXT,
  author_username TEXT,
  url TEXT, -- If tweet contains a link
  media_urls TEXT[], -- Images/videos
  summary TEXT, -- AI-generated summary
  content_type TEXT DEFAULT 'tweet', -- tweet, thread, article, image
  suggested_actions JSONB, -- AI action suggestions
  topics TEXT[], -- AI-generated topic tags
  status TEXT DEFAULT 'new', -- new, pending, done, snoozed, archived
  snooze_until TIMESTAMP WITH TIME ZONE,
  bookmark_created_at TIMESTAMP WITH TIME ZONE, -- When user bookmarked on Twitter
  processed_at TIMESTAMP WITH TIME ZONE, -- When we analyzed it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions table (in-app tasks/ideas)
CREATE TABLE actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- task, idea, note
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own actions" ON actions FOR ALL USING (auth.uid()::text = user_id::text);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_status ON bookmarks(status);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_bookmark_id ON actions(bookmark_id);
CREATE INDEX idx_bookmarks_twitter_id ON bookmarks(user_id, twitter_id);

-- Add unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX idx_bookmarks_user_twitter_unique ON bookmarks(user_id, twitter_id); 