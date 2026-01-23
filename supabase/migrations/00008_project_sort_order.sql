-- Migration 00008: Add sort_order to projects for drag-and-drop ordering

-- Add sort_order column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on current creation order (newest first)
UPDATE projects SET sort_order = subq.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM projects
) subq
WHERE projects.id = subq.id;

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);
