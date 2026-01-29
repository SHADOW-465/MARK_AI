-- ============================================
-- RPC Function: Find Similar Submissions using pgvector
-- Created: 2026-01-28
-- Purpose: Query for plagiarism detection via cosine similarity
-- ============================================

-- Function to find similar submissions using vector similarity
CREATE OR REPLACE FUNCTION find_similar_submissions(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    exclude_sheet_id uuid DEFAULT NULL,
    target_exam_id uuid DEFAULT NULL
)
RETURNS TABLE (
    answer_sheet_id uuid,
    student_name text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.answer_sheet_id,
        s.name as student_name,
        1 - (ps.embedding <=> query_embedding) as similarity
    FROM plagiarism_scores ps
    JOIN answer_sheets a ON a.id = ps.answer_sheet_id
    JOIN students s ON s.id = a.student_id
    WHERE 
        -- Exclude current sheet
        (exclude_sheet_id IS NULL OR ps.answer_sheet_id != exclude_sheet_id)
        -- Only search within same exam if specified
        AND (target_exam_id IS NULL OR a.exam_id = target_exam_id)
        -- Must have embedding
        AND ps.embedding IS NOT NULL
        -- Above similarity threshold
        AND 1 - (ps.embedding <=> query_embedding) > match_threshold
    ORDER BY ps.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_similar_submissions TO authenticated;

-- ============================================
-- Function to get plagiarism summary for a student
-- ============================================
CREATE OR REPLACE FUNCTION get_student_plagiarism_summary(p_student_id uuid)
RETURNS TABLE (
    total_submissions bigint,
    flagged_count bigint,
    avg_similarity float,
    highest_similarity int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ps.id) as total_submissions,
        COUNT(CASE WHEN ps.combined_score > 60 THEN 1 END) as flagged_count,
        COALESCE(AVG(ps.combined_score), 0)::float as avg_similarity,
        COALESCE(MAX(ps.combined_score), 0) as highest_similarity
    FROM plagiarism_scores ps
    JOIN answer_sheets a ON a.id = ps.answer_sheet_id
    WHERE a.student_id = p_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_student_plagiarism_summary TO authenticated;

-- ============================================
-- DONE!
-- ============================================
