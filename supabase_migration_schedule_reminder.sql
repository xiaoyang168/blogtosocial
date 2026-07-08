-- Add reminder_sent column to scheduled_posts
ALTER TABLE IF EXISTS scheduled_posts
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Add reminder_sent_at column for tracking
ALTER TABLE IF EXISTS scheduled_posts
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Create index for efficient cron querying
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_reminder
ON scheduled_posts (scheduled_at, reminder_sent, status)
WHERE status = 'scheduled' AND reminder_sent = FALSE;
