-- Make user_id nullable for project badges (badges can be awarded to projects, not just users)
ALTER TABLE badge_awards ALTER COLUMN user_id DROP NOT NULL;

-- Set all existing weeks to published (we removed the draft/publish toggle)
UPDATE weeks SET published = true WHERE published = false;

-- Also add Demos section to existing weeks that don't have one
INSERT INTO week_sections (week_id, slug, title, sort_order)
SELECT id, 'demos', 'Demos', 999 FROM weeks
WHERE NOT EXISTS (
  SELECT 1 FROM week_sections WHERE week_sections.week_id = weeks.id AND slug = 'demos'
);
