-- SAFE FIX: Only fixes the projects table
-- This will NOT touch your other tables (weeks, demos, badges, etc.)

-- Step 1: Check if projects table has the new columns, add them if missing
DO $$
BEGIN
  -- Add avatar_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'avatar_url') THEN
    ALTER TABLE projects ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add screenshots if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'screenshots') THEN
    ALTER TABLE projects ADD COLUMN screenshots JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add demo_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'demo_url') THEN
    ALTER TABLE projects ADD COLUMN demo_url TEXT;
  END IF;

  -- Add github_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'github_url') THEN
    ALTER TABLE projects ADD COLUMN github_url TEXT;
  END IF;

  -- Add tech_stack if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tech_stack') THEN
    ALTER TABLE projects ADD COLUMN tech_stack TEXT[] DEFAULT '{}';
  END IF;

  -- Add status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status') THEN
    ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;

  -- Remove one-project-per-user constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_user_id_key') THEN
    ALTER TABLE projects DROP CONSTRAINT projects_user_id_key;
  END IF;

  -- Add status check constraint if missing
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_status_check') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('draft', 'in_progress', 'completed'));
  END IF;
END $$;

-- Step 2: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tech_stack ON projects USING GIN(tech_stack);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Step 3: Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate RLS policies for projects
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create own project" ON projects;
DROP POLICY IF EXISTS "Users can update own project" ON projects;
DROP POLICY IF EXISTS "Users can delete own project" ON projects;

CREATE POLICY "Anyone can view projects" ON projects FOR SELECT TO public USING (true);
CREATE POLICY "Users can create own project" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Step 5: Storage bucket (safe - uses ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-images', 'project-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Step 6: Storage policies (drop and recreate)
DROP POLICY IF EXISTS "Users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for project images" ON storage.objects;

CREATE POLICY "Users can upload project images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own project images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own project images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public read access for project images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'project-images');

-- Verify the setup
SELECT 'Projects table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position;

SELECT 'Setup complete! Your other tables are untouched.' as status;
