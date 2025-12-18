-- Migration for Student OS Enhancements
-- 2025-01-02

-- 1. Add 'interests' and 'challenge_mode' to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS challenge_mode BOOLEAN DEFAULT FALSE;

-- 2. Add 'metadata' to student_tasks table for flexible AI attributes (effort_score, priority_weight, impact)
ALTER TABLE student_tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Add 'extracted_text' to study_materials is already there, but ensuring integrity if needed.
-- (No action needed based on previous file check)
