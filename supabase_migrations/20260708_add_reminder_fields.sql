-- Add reminder fields to scheduled_posts
ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Create index for fast cron queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_reminder
ON scheduled_posts (status, reminder_sent, scheduled_at)
WHERE status = 'scheduled' AND reminder_sent = FALSE;
