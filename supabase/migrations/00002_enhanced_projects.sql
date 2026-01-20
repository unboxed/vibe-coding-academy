-- Enhanced Projects Feature Migration
-- Adds support for multiple projects per user, avatars, screenshots, tech stack, and status
-- This migration is idempotent - safe to run multiple times

-- Step 1: Create the projects table if it doesn't exist
-- Note: This references profiles(id) to enable Supabase joins
-- The profiles table must exist first (run 00001_initial_schema.sql)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  links TEXT,
  avatar_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  demo_url TEXT,
  github_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: If table exists from 00001, add missing columns FIRST
DO $$
BEGIN
  -- Remove the one-project-per-user constraint to allow multiple projects
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_user_id_key'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_user_id_key;
  END IF;

  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'avatar_url') THEN
    ALTER TABLE projects ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'screenshots') THEN
    ALTER TABLE projects ADD COLUMN screenshots JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'demo_url') THEN
    ALTER TABLE projects ADD COLUMN demo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'github_url') THEN
    ALTER TABLE projects ADD COLUMN github_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tech_stack') THEN
    ALTER TABLE projects ADD COLUMN tech_stack TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status') THEN
    ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
END $$;

-- Step 3: Add status check constraint AFTER the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_status_check'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_status_check
      CHECK (status IN ('draft', 'in_progress', 'completed'));
  END IF;
END $$;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tech_stack ON projects USING GIN(tech_stack);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies (drop first to make idempotent)
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create own project" ON projects;
DROP POLICY IF EXISTS "Users can update own project" ON projects;
DROP POLICY IF EXISTS "Users can delete own project" ON projects;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own project"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
