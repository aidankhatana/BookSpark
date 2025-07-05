-- BookSpark Database Schema
-- This schema supports Twitter bookmark ingestion, AI analysis, and email digests

-- Enable Row Level Security
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS actions ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS users;

-- Users table (stores authenticated users and their preferences)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  twitter_username TEXT,
  avatar_url TEXT, -- User's profile picture
  twitter_token TEXT, -- Encrypted OAuth token
  twitter_refresh_token TEXT, -- Encrypted refresh token
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Digest preferences
  digest_enabled BOOLEAN DEFAULT true,
  digest_time TIME DEFAULT '08:00:00', -- User's preferred digest time
  last_digest_sent TIMESTAMP WITH TIME ZONE,
  
  -- User settings
  timezone TEXT DEFAULT 'UTC'
);

-- Bookmarks table (stores Twitter bookmarks with AI analysis)
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Twitter data
  twitter_id TEXT NOT NULL, -- Original tweet ID
  content TEXT NOT NULL, -- Tweet text
  author_name TEXT,
  author_username TEXT,
  author_profile_image TEXT, -- Author's profile picture URL
  author_verified BOOLEAN DEFAULT false, -- If author is verified
  url TEXT, -- Extracted URL if present
  expanded_urls JSONB, -- All extracted URLs with metadata
  media_attachments JSONB, -- Photos, videos, etc. from the tweet
  tweet_metrics JSONB, -- Like, retweet counts etc.
  bookmark_created_at TIMESTAMP WITH TIME ZONE, -- When user bookmarked it
  
  -- AI analysis
  summary TEXT, -- AI-generated summary (1-2 sentences)
  content_type TEXT, -- tweet, thread, article, image, video, etc.
  topics TEXT[], -- Array of topic tags
  suggested_actions TEXT[], -- Array of suggested actions
  sentiment TEXT, -- positive, negative, neutral
  reading_time_minutes INTEGER, -- Estimated reading time
  processed_at TIMESTAMP WITH TIME ZONE, -- When AI analysis completed
  
  -- Status management
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'pending', 'done', 'snoozed', 'archived')),
  snooze_until TIMESTAMP WITH TIME ZONE, -- When snoozed bookmark should resurface
  priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 3), -- 0=normal, 1=low, 2=high, 3=urgent
  
  -- Engagement tracking
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one bookmark per user per tweet
  UNIQUE(user_id, twitter_id)
);

-- Actions table (for in-app task management and PRD action types)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Action details
  type TEXT NOT NULL CHECK (type IN ('task', 'routine', 'idea', 'note', 'reminder', 'generate', 'summarize')),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[], -- User-defined tags
  
  -- Task-specific fields
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  subtasks JSONB, -- Array of subtask objects
  
  -- Routine-specific fields
  frequency TEXT, -- daily, weekly, monthly
  next_reminder TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  -- Integration data
  external_id TEXT, -- ID in external system (Notion, Todoist, etc.)
  external_system TEXT, -- notion, todoist, trello, etc.
  external_data JSONB, -- Additional integration-specific data
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email digest logs (track digest sending)
CREATE TABLE digest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email details
  email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bookmarks_included INTEGER NOT NULL,
  bookmark_ids UUID[], -- Track which bookmarks were included
  
  -- Engagement tracking
  email_opened BOOLEAN DEFAULT false,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  actions_clicked INTEGER DEFAULT 0,
  
  -- Email metadata
  email_subject TEXT,
  email_id TEXT -- External email service ID
);

-- Knowledge graph connections (for PRD visualization feature)
CREATE TABLE bookmark_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_a_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  bookmark_b_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL, -- topic_similarity, url_reference, author_similarity
  strength FLOAT CHECK (strength BETWEEN 0 AND 1), -- Connection strength (0-1)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate connections
  UNIQUE(bookmark_a_id, bookmark_b_id, connection_type)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (twitter_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR ALL USING (user_id IN (
  SELECT id FROM users WHERE twitter_id = current_setting('request.jwt.claims', true)::json->>'sub'
));
CREATE POLICY "Users can manage own actions" ON actions FOR ALL USING (user_id IN (
  SELECT id FROM users WHERE twitter_id = current_setting('request.jwt.claims', true)::json->>'sub'
));
CREATE POLICY "Users can view own digest logs" ON digest_logs FOR SELECT USING (user_id IN (
  SELECT id FROM users WHERE twitter_id = current_setting('request.jwt.claims', true)::json->>'sub'
));
CREATE POLICY "Users can view own connections" ON bookmark_connections FOR ALL USING (
  bookmark_a_id IN (
    SELECT id FROM bookmarks WHERE user_id IN (
      SELECT id FROM users WHERE twitter_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  )
);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_status ON bookmarks(user_id, status);
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_status_snooze ON bookmarks(status, snooze_until) WHERE status = 'snoozed';
CREATE INDEX idx_bookmarks_priority ON bookmarks(user_id, priority DESC);
CREATE INDEX idx_bookmarks_topics ON bookmarks USING GIN(topics);
CREATE INDEX idx_users_digest_enabled ON users(digest_enabled) WHERE digest_enabled = true;
CREATE INDEX idx_actions_user_completed ON actions(user_id, completed);
CREATE INDEX idx_actions_type ON actions(user_id, type);
CREATE INDEX idx_bookmarks_twitter_id ON bookmarks(user_id, twitter_id);
CREATE INDEX idx_bookmark_connections_strength ON bookmark_connections(strength DESC);

-- Add unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX idx_bookmarks_user_twitter_unique ON bookmarks(user_id, twitter_id);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically unsnoooze bookmarks
CREATE OR REPLACE FUNCTION unsnooze_bookmarks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE bookmarks 
  SET status = 'new', snooze_until = NULL
  WHERE status = 'snoozed' 
    AND snooze_until IS NOT NULL 
    AND snooze_until <= NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update view counts
CREATE OR REPLACE FUNCTION increment_bookmark_views(bookmark_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE bookmarks 
  SET view_count = view_count + 1, last_viewed_at = NOW()
  WHERE id = bookmark_id;
END;
$$ LANGUAGE plpgsql;

-- Seed data for development (optional)
-- INSERT INTO users (twitter_id, email, name, twitter_username) VALUES
--   ('123456789', 'test@example.com', 'Test User', 'testuser');

-- Comments for documentation
COMMENT ON TABLE users IS 'Authenticated users with their preferences and digest settings';
COMMENT ON TABLE bookmarks IS 'Twitter bookmarks with AI analysis and status tracking, enhanced for production UI';
COMMENT ON TABLE actions IS 'User-created tasks and ideas derived from bookmarks, supporting PRD action types';
COMMENT ON TABLE digest_logs IS 'Log of sent email digests for analytics and debugging';
COMMENT ON TABLE bookmark_connections IS 'Graph connections between bookmarks for knowledge visualization';

COMMENT ON COLUMN users.digest_time IS 'User preferred time for receiving daily digest (in their timezone)';
COMMENT ON COLUMN bookmarks.status IS 'Bookmark workflow status: new -> pending -> done/snoozed/archived';
COMMENT ON COLUMN bookmarks.snooze_until IS 'When a snoozed bookmark should become active again';
COMMENT ON COLUMN bookmarks.priority IS 'Bookmark priority: 0=normal, 1=low, 2=high, 3=urgent';
COMMENT ON COLUMN bookmarks.media_attachments IS 'JSON array of media (images, videos) attached to the tweet';
COMMENT ON COLUMN bookmarks.expanded_urls IS 'JSON array of all URLs with expanded metadata';
COMMENT ON COLUMN actions.type IS 'Action type: task, routine, idea, note, reminder, generate, summarize (from PRD)';
COMMENT ON COLUMN actions.external_system IS 'Which external system this action is synced with (notion, todoist, etc.)';
COMMENT ON COLUMN bookmark_connections.strength IS 'AI-calculated connection strength between bookmarks (0-1)'; 