-- Add status for dispute tracking
ALTER TABLE answer_sheets
ADD COLUMN review_status TEXT DEFAULT 'none' CHECK (review_status IN ('none', 'requested', 'resolved'));

-- Add fields for student reasoning
ALTER TABLE question_evaluations
ADD COLUMN is_review_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN student_comment TEXT;
