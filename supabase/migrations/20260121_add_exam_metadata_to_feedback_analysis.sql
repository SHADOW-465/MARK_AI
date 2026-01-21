-- Migration: Add exam metadata columns to feedback_analysis table
-- Purpose: Store exam name, marking scheme, and metadata when grades are finalized
-- This allows students to see exam name and answer keys even if the exam is deleted later
-- Created: 2026-01-21

-- ============================================
-- ADD NEW COLUMNS
-- ============================================

-- Add exam_name column to store the exam name at time of approval
ALTER TABLE feedback_analysis 
ADD COLUMN IF NOT EXISTS exam_name TEXT;

-- Add exam_subject column
ALTER TABLE feedback_analysis 
ADD COLUMN IF NOT EXISTS exam_subject TEXT;

-- Add exam_total_marks column
ALTER TABLE feedback_analysis 
ADD COLUMN IF NOT EXISTS exam_total_marks INTEGER;

-- Add exam_marking_scheme column to store complete marking scheme snapshot
-- This includes model_answer, rubric, max_marks, question_text for each question
ALTER TABLE feedback_analysis 
ADD COLUMN IF NOT EXISTS exam_marking_scheme JSONB;

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN feedback_analysis.exam_name IS 'Denormalized exam name stored at time of grade approval for student visibility';
COMMENT ON COLUMN feedback_analysis.exam_subject IS 'Denormalized subject stored at time of grade approval';
COMMENT ON COLUMN feedback_analysis.exam_total_marks IS 'Total marks of the exam at time of approval';
COMMENT ON COLUMN feedback_analysis.exam_marking_scheme IS 'Complete snapshot of marking scheme with model answers and rubrics at time of approval';

-- ============================================
-- VERIFICATION QUERY (Run after migration)
-- ============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'feedback_analysis' 
-- AND column_name IN ('exam_name', 'exam_subject', 'exam_total_marks', 'exam_marking_scheme');

-- ============================================
-- ROLLBACK SCRIPT (If needed)
-- ============================================
-- ALTER TABLE feedback_analysis 
-- DROP COLUMN IF EXISTS exam_name,
-- DROP COLUMN IF EXISTS exam_subject,
-- DROP COLUMN IF EXISTS exam_total_marks,
-- DROP COLUMN IF EXISTS exam_marking_scheme;
