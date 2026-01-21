-- ============================================
-- MARK AI - Complete Database Schema
-- Version: 1.0.0
-- Last Updated: 2025-12-25
-- ============================================
-- Run this script in Supabase SQL Editor to set up the entire database.
-- WARNING: This will reset the schema. Back up data first if needed.
-- ============================================

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    class TEXT NOT NULL,
    section VARCHAR(50),
    email TEXT,
    
    -- Gamification
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_active_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    interests TEXT[],
    challenge_mode BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT students_roll_class_key UNIQUE (roll_number, class)
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    exam_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    total_marks INTEGER NOT NULL,
    marking_scheme JSONB NOT NULL, -- Array of {question_num, topic, max_marks, keywords, sample_answer}
    answer_key_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer Sheets Table
CREATE TABLE IF NOT EXISTS answer_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT,
    file_urls TEXT[], -- For multi-page answer sheets
    total_score INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'graded', 'approved', 'error')),
    gemini_response JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Question Evaluations Table
CREATE TABLE IF NOT EXISTS question_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_sheet_id UUID REFERENCES answer_sheets(id) ON DELETE CASCADE,
    question_num INTEGER NOT NULL,
    ai_score NUMERIC,
    teacher_score NUMERIC,
    final_score NUMERIC,
    reasoning TEXT,
    gaps TEXT, -- Missing concepts
    root_cause TEXT, -- 'concept', 'calculation', 'keyword'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. STUDENT OS TABLES
-- ============================================

-- Feedback Analysis (Student Dashboard Data)
CREATE TABLE IF NOT EXISTS feedback_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_sheet_id UUID REFERENCES answer_sheets(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    -- Exam Metadata (Denormalized for student access after approval)
    exam_name TEXT,
    exam_subject TEXT,
    exam_total_marks INTEGER,
    exam_marking_scheme JSONB, -- Snapshot of marking scheme with model answers at time of approval
    
    -- Overall Feedback
    overall_feedback TEXT,
    
    -- The "Why" Widget
    real_world_application TEXT,
    why_it_matters TEXT,
    
    -- Performance Lab & Gap Analysis
    root_cause_analysis JSONB, -- {concept: 5, calculation: 2, keyword: 1}
    gap_analysis_text TEXT,
    
    -- Focus Engine
    focus_areas JSONB, -- ["Thermodynamics", "Kinematics"]
    roi_analysis JSONB, -- [{topic, potential_gain, effort}]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT feedback_analysis_answer_sheet_id_key UNIQUE (answer_sheet_id)
);

-- Study Materials (Knowledge Base / Deep Work Studio)
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    extracted_text TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Tasks (Autopilot / Planner)
CREATE TABLE IF NOT EXISTS student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
    type TEXT CHECK (type IN ('Focus', 'Exam Prep', 'Study', 'Assignment')),
    related_topic TEXT,
    estimated_duration INTEGER, -- minutes
    why TEXT, -- AI reasoning
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible AI attributes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards (Quizlet Layer)
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    
    -- Spaced Repetition (Leitner System)
    level INTEGER DEFAULT 1,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[],
    subject TEXT,
    source_answer_sheet_id UUID REFERENCES answer_sheets(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP Logs (Gamification History)
CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    activity_type TEXT NOT NULL, -- 'exam_review', 'note_upload', 'flashcard_sprint'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TRIGGERS
-- ============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_answer_sheets_updated_at ON answer_sheets;
CREATE TRIGGER set_answer_sheets_updated_at
    BEFORE UPDATE ON answer_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Link Student Account (Called during student signup)
CREATE OR REPLACE FUNCTION link_student_account(
    p_roll_number TEXT,
    p_class TEXT,
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_section TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_current_user_id UUID;
    v_norm_roll TEXT;
    v_norm_class TEXT;
BEGIN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN 
        RAISE EXCEPTION 'Not authenticated'; 
    END IF;

    -- Normalize inputs: Trim and Lowercase
    v_norm_roll := TRIM(LOWER(p_roll_number));
    v_norm_class := TRIM(LOWER(p_class));

    -- Find student using normalized matching
    SELECT id INTO v_student_id
    FROM students
    WHERE TRIM(LOWER(roll_number)) = v_norm_roll 
      AND (
          TRIM(LOWER(class)) = v_norm_class 
          OR REPLACE(TRIM(LOWER(class)), ' ', '') = REPLACE(v_norm_class, ' ', '')
      )
    LIMIT 1;

    IF v_student_id IS NOT NULL THEN
        -- Check if already claimed by another user
        IF EXISTS (SELECT 1 FROM students WHERE id = v_student_id AND user_id IS NOT NULL AND user_id != v_current_user_id) THEN
            RAISE EXCEPTION 'This student record is already linked to another account.';
        END IF;

        -- Update existing record
        UPDATE students
        SET user_id = v_current_user_id,
            email = p_email,
            name = COALESCE(p_name, name),
            section = COALESCE(p_section, section)
        WHERE id = v_student_id;
    ELSE
        -- Create new if not found
        INSERT INTO students (roll_number, class, name, section, email, user_id)
        VALUES (p_roll_number, p_class, p_name, p_section, p_email, v_current_user_id)
        RETURNING id INTO v_student_id;
    END IF;

    RETURN v_student_id;
END;
$$;

-- Award XP to Student
CREATE OR REPLACE FUNCTION award_student_xp(
    p_student_id UUID,
    p_amount INTEGER,
    p_activity TEXT,
    p_desc TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert Log
    INSERT INTO xp_logs (student_id, amount, activity_type, description)
    VALUES (p_student_id, p_amount, p_activity, p_desc);

    -- Update Student Stats with streak logic
    UPDATE students
    SET 
        xp = xp + p_amount,
        last_active_at = NOW(),
        streak = CASE 
            WHEN last_active_at IS NULL THEN 1
            WHEN last_active_at::date = (NOW() - INTERVAL '1 day')::date THEN streak + 1
            WHEN last_active_at::date = NOW()::date THEN streak
            ELSE 1
        END
    WHERE id = p_student_id;
END;
$$;

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

-- === STUDENTS TABLE ===
DROP POLICY IF EXISTS "Students view own profile" ON students;
CREATE POLICY "Students view own profile" ON students
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students update own profile" ON students;
CREATE POLICY "Students update own profile" ON students
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers view all students" ON students;
CREATE POLICY "Teachers view all students" ON students
FOR SELECT USING (EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid()));

-- === ANSWER SHEETS ===
DROP POLICY IF EXISTS "Students view own answer sheets" ON answer_sheets;
CREATE POLICY "Students view own answer sheets" ON answer_sheets
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM students 
        WHERE id = answer_sheets.student_id 
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers manage all answer sheets" ON answer_sheets;
CREATE POLICY "Teachers manage all answer sheets" ON answer_sheets
FOR ALL USING (EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid()));

-- === QUESTION EVALUATIONS ===
DROP POLICY IF EXISTS "Students view own evaluations" ON question_evaluations;
CREATE POLICY "Students view own evaluations" ON question_evaluations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM answer_sheets 
        JOIN students ON students.id = answer_sheets.student_id
        WHERE answer_sheets.id = question_evaluations.answer_sheet_id
        AND students.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers manage all evaluations" ON question_evaluations;
CREATE POLICY "Teachers manage all evaluations" ON question_evaluations
FOR ALL USING (EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid()));

-- === FEEDBACK ANALYSIS ===
DROP POLICY IF EXISTS "Students view own feedback" ON feedback_analysis;
CREATE POLICY "Students view own feedback" ON feedback_analysis
FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE id = feedback_analysis.student_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers manage all feedback" ON feedback_analysis;
CREATE POLICY "Teachers manage all feedback" ON feedback_analysis
FOR ALL USING (EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid()));

-- === STUDY MATERIALS ===
DROP POLICY IF EXISTS "Students manage own materials" ON study_materials;
CREATE POLICY "Students manage own materials" ON study_materials
FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE id = study_materials.student_id AND user_id = auth.uid())
);

-- === STUDENT TASKS ===
DROP POLICY IF EXISTS "Students manage own tasks" ON student_tasks;
CREATE POLICY "Students manage own tasks" ON student_tasks
FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE id = student_tasks.student_id AND user_id = auth.uid())
);

-- === FLASHCARDS ===
DROP POLICY IF EXISTS "Students manage own flashcards" ON flashcards;
CREATE POLICY "Students manage own flashcards" ON flashcards
FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE id = flashcards.student_id AND user_id = auth.uid())
);

-- === XP LOGS ===
DROP POLICY IF EXISTS "Students view own xp_logs" ON xp_logs;
CREATE POLICY "Students view own xp_logs" ON xp_logs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE id = xp_logs.student_id AND user_id = auth.uid())
);

-- ============================================
-- 6. STORAGE BUCKETS (Run separately if needed)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('study_materials', 'study_materials', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('answer_sheets', 'answer_sheets', true);

-- ============================================
-- DONE! Your MARK AI database is ready.
-- ============================================
