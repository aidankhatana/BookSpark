-- Migration: Update users table to match latest schema
-- Run this in your Supabase SQL editor to add missing columns

-- Add digest_enabled column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='digest_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN digest_enabled BOOLEAN DEFAULT true;
        COMMENT ON COLUMN users.digest_enabled IS 'Whether user wants to receive digest emails';
    END IF;
END $$;

-- Add digest_time column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='digest_time'
    ) THEN
        ALTER TABLE users ADD COLUMN digest_time TIME DEFAULT '08:00:00';
        COMMENT ON COLUMN users.digest_time IS 'User preferred time for digest emails';
    END IF;
END $$;

-- Add timezone column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='timezone'
    ) THEN
        ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
        COMMENT ON COLUMN users.timezone IS 'User timezone for digest scheduling';
    END IF;
END $$;

-- Add email column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='email'
    ) THEN
        ALTER TABLE users ADD COLUMN email TEXT;
        COMMENT ON COLUMN users.email IS 'User email address - from Twitter OAuth or manually entered';
    END IF;
END $$;

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        COMMENT ON COLUMN users.avatar_url IS 'User profile picture URL';
    END IF;
END $$;

-- Add last_digest_sent column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='last_digest_sent'
    ) THEN
        ALTER TABLE users ADD COLUMN last_digest_sent TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN users.last_digest_sent IS 'When the last digest email was sent';
    END IF;
END $$;

-- Add enhanced bookmark columns for rich UI
DO $$ 
BEGIN 
    -- author_profile_image
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='author_profile_image'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN author_profile_image TEXT;
    END IF;

    -- author_verified
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='author_verified'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN author_verified BOOLEAN DEFAULT false;
    END IF;

    -- expanded_urls
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='expanded_urls'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN expanded_urls JSONB;
    END IF;

    -- media_attachments
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='media_attachments'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN media_attachments JSONB;
    END IF;

    -- tweet_metrics
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='tweet_metrics'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN tweet_metrics JSONB;
    END IF;

    -- priority
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='priority'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN priority INTEGER DEFAULT 0;
        ALTER TABLE bookmarks ADD CONSTRAINT priority_check CHECK (priority BETWEEN 0 AND 3);
    END IF;

    -- view_count
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='view_count'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;

    -- sentiment
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='sentiment'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN sentiment TEXT;
    END IF;

    -- reading_time_minutes
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='reading_time_minutes'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN reading_time_minutes INTEGER;
    END IF;

    -- last_viewed_at
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='bookmarks' 
        AND column_name='last_viewed_at'
    ) THEN
        ALTER TABLE bookmarks ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Verify all columns were added successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'bookmarks')
AND column_name IN (
    'digest_enabled', 'digest_time', 'timezone', 'email', 'avatar_url', 'last_digest_sent',
    'author_profile_image', 'author_verified', 'expanded_urls', 'media_attachments', 
    'tweet_metrics', 'priority', 'view_count', 'sentiment', 'reading_time_minutes', 'last_viewed_at'
)
ORDER BY table_name, column_name; 