-- Migration 00007: Make week number optional
-- Allows weeks to be created without a number (as a tag that can be added later)

-- Remove NOT NULL constraint from weeks.number
ALTER TABLE weeks ALTER COLUMN number DROP NOT NULL;

-- Drop the check constraint that limits numbers to 1-10
ALTER TABLE weeks DROP CONSTRAINT IF EXISTS weeks_number_check;

-- Note: UNIQUE constraint remains, but PostgreSQL allows multiple NULLs in unique columns
