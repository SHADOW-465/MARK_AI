-- Migration: Schema Fixes for Data Integrity
-- Date: 2025-12-25
-- Purpose: Add missing columns, improve constraints, prevent null reference errors

-- ============================================
-- 1. Add timestamps to answer_sheets
-- ============================================
ALTER TABLE answer_sheets 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 2. Add overall_feedback to feedback_analysis if missing
-- ============================================
ALTER TABLE feedback_analysis 
ADD COLUMN IF NOT EXISTS overall_feedback TEXT;

-- ============================================
-- 3. Create trigger to update updated_at automatically
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to answer_sheets
DROP TRIGGER IF EXISTS set_answer_sheets_updated_at ON answer_sheets;
CREATE TRIGGER set_answer_sheets_updated_at
    BEFORE UPDATE ON answer_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Add answer_sheet_id unique constraint on feedback_analysis
-- (for upsert to work properly)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feedback_analysis_answer_sheet_id_key'
    ) THEN
        ALTER TABLE feedback_analysis 
        ADD CONSTRAINT feedback_analysis_answer_sheet_id_key UNIQUE (answer_sheet_id);
    END IF;
END $$;

-- ============================================
-- 5. Ensure teachers can manage feedback_analysis
-- ============================================
DROP POLICY IF EXISTS "Teachers manage all feedback" ON feedback_analysis;
CREATE POLICY "Teachers manage all feedback" ON feedback_analysis
FOR ALL
USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())
);

-- ============================================
-- 6. Update existing answer_sheets to have created_at if null
-- ============================================
UPDATE answer_sheets 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- ============================================
-- Done! Run this in Supabase SQL Editor
-- ============================================
