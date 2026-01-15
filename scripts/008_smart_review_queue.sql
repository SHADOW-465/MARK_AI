-- ============================================
-- MARK AI - Migration 008: Smart Review Queue Support
-- Version: 1.0.0
-- Date: 2026-01-16
-- ============================================
-- This migration adds confidence scoring fields to enable Smart Review Queue functionality.
-- Teachers can filter and batch-approve graded sheets based on AI confidence levels.
-- ============================================

-- 1. Add confidence column to answer_sheets if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'answer_sheets' AND column_name = 'confidence'
    ) THEN
        ALTER TABLE answer_sheets ADD COLUMN confidence NUMERIC DEFAULT NULL;
    END IF;
END $$;

-- 2. Add confidence column to question_evaluations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_evaluations' AND column_name = 'confidence'
    ) THEN
        ALTER TABLE question_evaluations ADD COLUMN confidence NUMERIC DEFAULT NULL;
    END IF;
END $$;

-- 3. Add extracted_text column to question_evaluations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_evaluations' AND column_name = 'extracted_text'
    ) THEN
        ALTER TABLE question_evaluations ADD COLUMN extracted_text TEXT DEFAULT NULL;
    END IF;
END $$;

-- 4. Add strengths column to question_evaluations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_evaluations' AND column_name = 'strengths'
    ) THEN
        ALTER TABLE question_evaluations ADD COLUMN strengths JSONB DEFAULT NULL;
    END IF;
END $$;

-- 5. Create index on confidence for faster filtering
CREATE INDEX IF NOT EXISTS idx_answer_sheets_confidence ON answer_sheets(confidence);
CREATE INDEX IF NOT EXISTS idx_answer_sheets_status_confidence ON answer_sheets(status, confidence);

-- 6. Create a function to get confidence tier
CREATE OR REPLACE FUNCTION get_confidence_tier(confidence_score NUMERIC)
RETURNS TEXT AS $$
BEGIN
    IF confidence_score IS NULL THEN
        RETURN 'unknown';
    ELSIF confidence_score >= 0.9 THEN
        RETURN 'high';
    ELSIF confidence_score >= 0.75 THEN
        RETURN 'medium';
    ELSE
        RETURN 'low';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Create a view for Smart Review Queue statistics
CREATE OR REPLACE VIEW review_queue_stats AS
SELECT 
    exam_id,
    COUNT(*) as total_sheets,
    COUNT(*) FILTER (WHERE status = 'graded') as pending_review,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'graded' AND confidence >= 0.9) as high_confidence,
    COUNT(*) FILTER (WHERE status = 'graded' AND confidence >= 0.75 AND confidence < 0.9) as medium_confidence,
    COUNT(*) FILTER (WHERE status = 'graded' AND confidence < 0.75) as low_confidence,
    AVG(confidence) FILTER (WHERE status = 'graded') as avg_confidence
FROM answer_sheets
GROUP BY exam_id;

-- 8. Grant access to the view for authenticated users
GRANT SELECT ON review_queue_stats TO authenticated;

-- ============================================
-- DONE! Smart Review Queue support added.
-- ============================================
