-- Migration for Student OS
-- Created by Jules

-- 1. Add user_id to students table to link with auth.users
-- We check if it exists first to avoid errors if re-run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
        ALTER TABLE students ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Create feedback_analysis table
-- Stores detailed AI analysis for the "Student OS" features
CREATE TABLE IF NOT EXISTS feedback_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_sheet_id UUID REFERENCES answer_sheets(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,

    -- The "Why" Widget
    real_world_application TEXT,
    why_it_matters TEXT,

    -- Performance Lab & Gap Analysis
    root_cause_analysis JSONB, -- e.g. { "concept": 5, "calculation": 2, "keyword": 1 }
    gap_analysis_text TEXT,

    -- Focus Engine
    focus_areas JSONB, -- ["Thermodynamics", "Kinematics"]
    roi_analysis JSONB, -- e.g. [ { "topic": "Thermodynamics", "potential_gain": 5, "effort": "Medium" } ]

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create study_materials table (Knowledge Base / Deep Work Studio)
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL, -- URL in Supabase Storage
    file_type TEXT, -- 'pdf', 'image', etc.
    extracted_text TEXT, -- Stored text for simple RAG
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create student_tasks table (Autopilot / Focus Engine)
CREATE TABLE IF NOT EXISTS student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    type TEXT CHECK (type IN ('Focus', 'Exam Prep', 'Study', 'Assignment')), -- Matched UI values
    related_topic TEXT,
    estimated_duration INTEGER, -- in minutes
    why TEXT, -- AI reasoning
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Note: 'auth.uid()' refers to the logged-in user.
-- We link auth.uid() -> students.user_id -> students.id

-- Feedback Analysis:
-- Students can READ their own feedback.
-- Teachers (Admin) can READ/WRITE (Assuming teachers have a role or just full access via service role/admin policies)
-- Here we add a generic "Users can read their own data via student link" policy.

CREATE POLICY "Students view own feedback" ON feedback_analysis
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM students WHERE id = feedback_analysis.student_id
    )
);

-- Study Materials:
-- Students can CRUD their own materials.
CREATE POLICY "Students manage own materials" ON study_materials
FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM students WHERE id = study_materials.student_id
    )
);

-- Student Tasks:
-- Students can CRUD their own tasks.
CREATE POLICY "Students manage own tasks" ON student_tasks
FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM students WHERE id = student_tasks.student_id
    )
);

-- 6. Storage Bucket (Instructional)
-- SQL cannot easily create storage buckets in Supabase without specific extensions/wrappers usually.
-- Ideally, execute: insert into storage.buckets (id, name, public) values ('study_materials', 'study_materials', true);
-- and add policies for storage.objects.
