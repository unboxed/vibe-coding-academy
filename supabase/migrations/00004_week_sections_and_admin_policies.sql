-- Migration: Dynamic Week Sections and Admin-Only Policies
-- This migration:
-- 1. Creates week_sections table for dynamic tabs
-- 2. Updates RLS policies to be admin-only (removes facilitator)
-- 3. Adds admin policies for editing projects and profiles

-- ============================================
-- 1. Create week_sections table
-- ============================================

CREATE TABLE IF NOT EXISTS week_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_id, slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_week_sections_week_id ON week_sections(week_id);
CREATE INDEX IF NOT EXISTS idx_week_sections_sort_order ON week_sections(week_id, sort_order);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_week_sections_updated_at ON week_sections;
CREATE TRIGGER update_week_sections_updated_at
  BEFORE UPDATE ON week_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE week_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for week_sections
DROP POLICY IF EXISTS "Anyone can view week sections" ON week_sections;
CREATE POLICY "Anyone can view week sections"
  ON week_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage week sections" ON week_sections;
CREATE POLICY "Admins can manage week sections"
  ON week_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- ============================================
-- 2. Update facilitator users to admin
-- ============================================

UPDATE profiles SET role = 'admin' WHERE role = 'facilitator';

-- ============================================
-- 3. Update RLS Policies (remove facilitator)
-- ============================================

-- Weeks policies - admin only
DROP POLICY IF EXISTS "Anyone can view published weeks" ON weeks;
CREATE POLICY "Anyone can view published weeks"
  ON weeks FOR SELECT
  USING (published = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins and facilitators can insert weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can insert weeks" ON weeks;
CREATE POLICY "Admins can insert weeks"
  ON weeks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins and facilitators can update weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can update weeks" ON weeks;
CREATE POLICY "Admins can update weeks"
  ON weeks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins and facilitators can delete weeks" ON weeks;
DROP POLICY IF EXISTS "Admins can delete weeks" ON weeks;
CREATE POLICY "Admins can delete weeks"
  ON weeks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Badges policies - admin only
DROP POLICY IF EXISTS "Admins and facilitators can manage badges" ON badges;
DROP POLICY IF EXISTS "Admins can manage badges" ON badges;
CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Badge awards policies - admin only
DROP POLICY IF EXISTS "Admins and facilitators can award badges" ON badge_awards;
DROP POLICY IF EXISTS "Admins can award badges" ON badge_awards;
CREATE POLICY "Admins can award badges"
  ON badge_awards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins and facilitators can delete badge awards" ON badge_awards;
DROP POLICY IF EXISTS "Admins can delete badge awards" ON badge_awards;
CREATE POLICY "Admins can delete badge awards"
  ON badge_awards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- ============================================
-- 4. Add admin policies for projects
-- ============================================

-- Update existing project policies to include admin access
DROP POLICY IF EXISTS "Users can update own project" ON projects;
CREATE POLICY "Users can update own project"
  ON projects FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete own project" ON projects;
CREATE POLICY "Users can delete own project"
  ON projects FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 5. Add admin policy for updating profiles
-- ============================================

-- Allow admins to update any profile (for role changes)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. Migrate existing week content to sections
-- ============================================

-- Insert sections for each existing week
INSERT INTO week_sections (week_id, slug, title, content, sort_order, is_system)
SELECT
  id as week_id,
  'overview' as slug,
  'Overview' as title,
  overview as content,
  0 as sort_order,
  true as is_system
FROM weeks
WHERE NOT EXISTS (
  SELECT 1 FROM week_sections ws WHERE ws.week_id = weeks.id AND ws.slug = 'overview'
);

INSERT INTO week_sections (week_id, slug, title, content, sort_order, is_system)
SELECT
  id as week_id,
  'prework' as slug,
  'Pre-work' as title,
  prework as content,
  1 as sort_order,
  true as is_system
FROM weeks
WHERE NOT EXISTS (
  SELECT 1 FROM week_sections ws WHERE ws.week_id = weeks.id AND ws.slug = 'prework'
);

INSERT INTO week_sections (week_id, slug, title, content, sort_order, is_system)
SELECT
  id as week_id,
  'session' as slug,
  'Session' as title,
  session_plan as content,
  2 as sort_order,
  true as is_system
FROM weeks
WHERE NOT EXISTS (
  SELECT 1 FROM week_sections ws WHERE ws.week_id = weeks.id AND ws.slug = 'session'
);

INSERT INTO week_sections (week_id, slug, title, content, sort_order, is_system)
SELECT
  id as week_id,
  'prompts' as slug,
  'Prompts' as title,
  prompts as content,
  3 as sort_order,
  true as is_system
FROM weeks
WHERE NOT EXISTS (
  SELECT 1 FROM week_sections ws WHERE ws.week_id = weeks.id AND ws.slug = 'prompts'
);

INSERT INTO week_sections (week_id, slug, title, content, sort_order, is_system)
SELECT
  id as week_id,
  'resources' as slug,
  'Resources' as title,
  resources as content,
  4 as sort_order,
  true as is_system
FROM weeks
WHERE NOT EXISTS (
  SELECT 1 FROM week_sections ws WHERE ws.week_id = weeks.id AND ws.slug = 'resources'
);
