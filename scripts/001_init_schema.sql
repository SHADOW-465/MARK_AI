-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schools
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subjects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    roll_number VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    section VARCHAR(10),
    photo_url TEXT,
    dob DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, roll_number)
);

-- Parents
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-Student Links
CREATE TABLE IF NOT EXISTS parent_student_links (
    parent_id UUID REFERENCES parents(id),
    student_id UUID REFERENCES students(id),
    relation VARCHAR(50), -- 'father', 'mother', 'guardian'
    PRIMARY KEY (parent_id, student_id)
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    teacher_id UUID REFERENCES teachers(id),
    subject VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    total_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    marking_precision VARCHAR(50) DEFAULT 'whole', -- 'whole', 'half', 'quarter'
    marking_scheme JSONB NOT NULL, -- [{question_num, question_text, max_marks, rubric, model_answer}, ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer Sheets
CREATE TABLE IF NOT EXISTS answer_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES students(id),
    file_url TEXT NOT NULL, -- S3/Supabase Storage URL
    uploaded_by UUID REFERENCES teachers(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'graded', 'approved'
    gemini_response JSONB, -- Full Gemini JSON response
    total_score FLOAT,
    confidence FLOAT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES teachers(id),
    UNIQUE(exam_id, student_id)
);

-- Question Evaluations
CREATE TABLE IF NOT EXISTS question_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_sheet_id UUID REFERENCES answer_sheets(id),
    question_num INT NOT NULL,
    extracted_text TEXT,
    ai_score FLOAT,
    teacher_score FLOAT, -- NULL if not overridden
    final_score FLOAT NOT NULL,
    confidence FLOAT,
    reasoning TEXT,
    strengths TEXT[],
    gaps TEXT[],
    teacher_override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL, -- teacher or parent
    to_user_id UUID NOT NULL,
    from_role VARCHAR(20) NOT NULL, -- 'teacher', 'parent'
    to_role VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_role VARCHAR(20) NOT NULL, -- 'teacher', 'parent', 'student'
    type VARCHAR(50) NOT NULL, -- 'result_published', 'low_score', 'message'
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic Policies (To be refined)
-- Allow read access to authenticated users for now
CREATE POLICY "Allow read access for authenticated users" ON schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON parents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON answer_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON question_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON notifications FOR SELECT TO authenticated USING (true);

-- Allow insert for authenticated users (for testing/setup)
CREATE POLICY "Allow insert for authenticated users" ON schools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON teachers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON parents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON answer_sheets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON question_evaluations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
