-- Migration 00009: Add project_id to badge_awards for direct project badges

-- Add project_id column to badge_awards (nullable for backward compatibility)
ALTER TABLE badge_awards ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Create index for efficient project badge lookups
CREATE INDEX IF NOT EXISTS idx_badge_awards_project_id ON badge_awards(project_id);

-- Note: Existing badge_awards with user_id will have NULL project_id
-- New badges can be awarded directly to projects using project_id
