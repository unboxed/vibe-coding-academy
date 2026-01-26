-- Migration 00006: Project Feedback
-- Allows instructors/admins to add feedback to projects

-- Create project_feedback table
CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_feedback_project_id ON project_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_project_feedback_instructor_id ON project_feedback(instructor_id);

-- Enable RLS (but all operations will go through server actions with admin client)
ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read feedback
CREATE POLICY "Anyone can read project feedback" ON project_feedback
  FOR SELECT USING (true);

-- Policy to allow admins to insert feedback (but we mainly use server actions)
CREATE POLICY "Admins can insert feedback" ON project_feedback
  FOR INSERT WITH CHECK (true);

-- Policy to allow admins to update feedback
CREATE POLICY "Admins can update feedback" ON project_feedback
  FOR UPDATE USING (true);

-- Policy to allow admins to delete feedback
CREATE POLICY "Admins can delete feedback" ON project_feedback
  FOR DELETE USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_feedback_updated_at
  BEFORE UPDATE ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_project_feedback_updated_at();
