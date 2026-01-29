-- ============================================
-- PHASE 2: Database Migration
-- Created: 2026-01-28
-- Purpose: Add Plagiarism Detection, Parent Portal, and Admin Analytics tables
-- ============================================

-- ============================================
-- 1. ENABLE VECTOR EXTENSION
-- ============================================
-- Required for plagiarism detection embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. ADD DOB TO STUDENTS (for parent verification)
-- ============================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS dob DATE;

-- ============================================
-- 3. PLAGIARISM DETECTION TABLES
-- ============================================

-- Plagiarism Scores Table
CREATE TABLE IF NOT EXISTS plagiarism_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_sheet_id UUID REFERENCES answer_sheets(id) ON DELETE CASCADE,
    
    -- Similarity Scores (0-100)
    model_similarity INTEGER DEFAULT 0,      -- Similarity to model answer
    peer_similarity INTEGER DEFAULT 0,       -- Highest similarity to peer submissions
    combined_score INTEGER DEFAULT 0,        -- Max of the two
    
    -- Match Details
    matched_peers JSONB DEFAULT '[]'::jsonb, -- [{answer_sheet_id, student_name, similarity, snippet}]
    
    -- Embedding Vector (Gemini text-embedding-004 = 768 dimensions)
    embedding vector(768),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked', 'error', 'flagged')),
    flagged_by_teacher BOOLEAN DEFAULT FALSE,
    teacher_notes TEXT,
    
    -- Timestamps
    checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT plagiarism_scores_answer_sheet_id_key UNIQUE (answer_sheet_id)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_plagiarism_embedding ON plagiarism_scores 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 4. PARENT PORTAL TABLES
-- ============================================

-- Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-Student Mapping Table
CREATE TABLE IF NOT EXISTS parent_student_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relation TEXT CHECK (relation IN ('father', 'mother', 'guardian', 'other')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT parent_student_mapping_unique UNIQUE (parent_id, student_id)
);

-- ============================================
-- 5. ADMIN ANALYTICS VIEWS (Materialized for performance)
-- ============================================

-- School-Wide Stats View
CREATE OR REPLACE VIEW school_stats AS
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.last_active_at > NOW() - INTERVAL '7 days' THEN s.id END) as active_students_7d,
    COUNT(DISTINCT e.id) as total_exams,
    COUNT(DISTINCT a.id) as total_answer_sheets,
    COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.id END) as graded_sheets,
    COALESCE(AVG(a.total_score), 0) as avg_score,
    COUNT(DISTINCT CASE WHEN ps.combined_score > 60 THEN ps.answer_sheet_id END) as high_plagiarism_count
FROM students s
LEFT JOIN answer_sheets a ON a.student_id = s.id
LEFT JOIN exams e ON a.exam_id = e.id
LEFT JOIN plagiarism_scores ps ON ps.answer_sheet_id = a.id;

-- Class Performance View
CREATE OR REPLACE VIEW class_performance AS
SELECT 
    s.class,
    COUNT(DISTINCT s.id) as student_count,
    COUNT(DISTINCT a.id) as exam_count,
    COALESCE(AVG(a.total_score), 0) as avg_score,
    COALESCE(MAX(a.total_score), 0) as highest_score,
    COALESCE(MIN(CASE WHEN a.total_score > 0 THEN a.total_score END), 0) as lowest_score
FROM students s
LEFT JOIN answer_sheets a ON a.student_id = s.id AND a.status = 'approved'
GROUP BY s.class
ORDER BY s.class;

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE plagiarism_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_mapping ENABLE ROW LEVEL SECURITY;

-- === PLAGIARISM SCORES ===
-- Teachers can manage all plagiarism scores
DROP POLICY IF EXISTS "Teachers manage plagiarism scores" ON plagiarism_scores;
CREATE POLICY "Teachers manage plagiarism scores" ON plagiarism_scores
FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())
    OR 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'teacher'
);

-- Students can view their own plagiarism scores
DROP POLICY IF EXISTS "Students view own plagiarism" ON plagiarism_scores;
CREATE POLICY "Students view own plagiarism" ON plagiarism_scores
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM answer_sheets a
        JOIN students s ON s.id = a.student_id
        WHERE a.id = plagiarism_scores.answer_sheet_id
        AND s.user_id = auth.uid()
    )
);

-- === PARENTS TABLE ===
-- Parents can manage their own profile
DROP POLICY IF EXISTS "Parents manage own profile" ON parents;
CREATE POLICY "Parents manage own profile" ON parents
FOR ALL USING (user_id = auth.uid());

-- === PARENT-STUDENT MAPPING ===
-- Parents can view their mappings
DROP POLICY IF EXISTS "Parents view own mappings" ON parent_student_mapping;
CREATE POLICY "Parents view own mappings" ON parent_student_mapping
FOR SELECT USING (
    EXISTS (SELECT 1 FROM parents WHERE id = parent_student_mapping.parent_id AND user_id = auth.uid())
);

-- Parents can insert new mappings (claim students)
DROP POLICY IF EXISTS "Parents can claim students" ON parent_student_mapping;
CREATE POLICY "Parents can claim students" ON parent_student_mapping
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM parents WHERE id = parent_student_mapping.parent_id AND user_id = auth.uid())
);

-- Admins can manage all parent-student mappings
DROP POLICY IF EXISTS "Admins manage all mappings" ON parent_student_mapping;
CREATE POLICY "Admins manage all mappings" ON parent_student_mapping
FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- Teachers can view all parent-student mappings
DROP POLICY IF EXISTS "Teachers view mappings" ON parent_student_mapping;
CREATE POLICY "Teachers view mappings" ON parent_student_mapping
FOR SELECT USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())
    OR 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'teacher'
);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to verify parent-student claim
CREATE OR REPLACE FUNCTION verify_parent_claim(
    p_roll_number TEXT,
    p_dob DATE,
    p_parent_id UUID,
    p_relation TEXT DEFAULT 'guardian'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN 
        RAISE EXCEPTION 'Not authenticated'; 
    END IF;

    -- Verify parent exists and belongs to current user
    IF NOT EXISTS (SELECT 1 FROM parents WHERE id = p_parent_id AND user_id = v_current_user_id) THEN
        RAISE EXCEPTION 'Parent profile not found';
    END IF;

    -- Find student with matching roll number and DOB
    SELECT id INTO v_student_id
    FROM students
    WHERE TRIM(LOWER(roll_number)) = TRIM(LOWER(p_roll_number))
      AND dob = p_dob
    LIMIT 1;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found. Please check Roll Number and Date of Birth.';
    END IF;

    -- Check if already claimed by this parent
    IF EXISTS (SELECT 1 FROM parent_student_mapping WHERE parent_id = p_parent_id AND student_id = v_student_id) THEN
        RAISE EXCEPTION 'You have already claimed this student.';
    END IF;

    -- Create mapping
    INSERT INTO parent_student_mapping (parent_id, student_id, relation, verified_at)
    VALUES (p_parent_id, v_student_id, p_relation, NOW());

    RETURN v_student_id;
END;
$$;

-- Function to get plagiarism color based on score
CREATE OR REPLACE FUNCTION get_plagiarism_color(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF score <= 30 THEN RETURN 'green';
    ELSIF score <= 60 THEN RETURN 'yellow';
    ELSIF score <= 80 THEN RETURN 'orange';
    ELSE RETURN 'red';
    END IF;
END;
$$;

-- ============================================
-- DONE! Phase 2 Schema Ready.
-- ============================================
