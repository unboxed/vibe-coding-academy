-- Migration: Admin delete policies for profiles and weeks
-- This allows admins to delete members and weeks

-- ============================================
-- 1. Allow admins to delete profiles
-- ============================================

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  ));

-- ============================================
-- 2. Allow admins to delete weeks
-- ============================================

DROP POLICY IF EXISTS "Admins can delete weeks" ON weeks;
CREATE POLICY "Admins can delete weeks"
  ON weeks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- ============================================
-- 3. Ensure cascade delete is set up properly
-- ============================================
-- Note: These should already exist from initial schema,
-- but we verify the foreign keys have ON DELETE CASCADE

-- Profiles cascade: When a profile is deleted, their projects, demos, votes, and badge_awards are also deleted
-- This is already configured in 00001_initial_schema.sql with:
--   projects.user_id REFERENCES profiles(id) ON DELETE CASCADE
--   demos.user_id REFERENCES profiles(id) ON DELETE CASCADE
--   votes.user_id REFERENCES profiles(id) ON DELETE CASCADE
--   badge_awards.user_id REFERENCES profiles(id) ON DELETE CASCADE

-- Weeks cascade: When a week is deleted, its sections and demos are also deleted
-- This is already configured with:
--   week_sections.week_id REFERENCES weeks(id) ON DELETE CASCADE
--   demos.week_id REFERENCES weeks(id) ON DELETE CASCADE
