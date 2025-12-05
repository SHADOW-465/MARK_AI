-- Re-create tables to link with auth.users
-- We drop them first to ensure clean state (assuming no data yet)
DROP TABLE IF EXISTS question_evaluations;
DROP TABLE IF EXISTS answer_sheets;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS parent_student_links;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS students; -- Re-create to be safe, though it doesn't link to auth.users directly in the same way (students might not have logins initially)

-- Schools (Keep as is, but ensure RLS)
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers: ID links to auth.users
CREATE TABLE teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subjects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parents: ID links to auth.users
CREATE TABLE parents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students (Managed by teachers, but can optionally link to auth.users later)
CREATE TABLE students (
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

-- Parent-Student Links
CREATE TABLE parent_student_links (
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relation VARCHAR(50),
    PRIMARY KEY (parent_id, student_id)
);

-- Exams
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    teacher_id UUID REFERENCES teachers(id),
    subject VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    total_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    marking_precision VARCHAR(50) DEFAULT 'whole',
    marking_scheme JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer Sheets
CREATE TABLE answer_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES teachers(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded',
    gemini_response JSONB,
    total_score FLOAT,
    confidence FLOAT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES teachers(id),
    UNIQUE(exam_id, student_id)
);

-- Question Evaluations
CREATE TABLE question_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_sheet_id UUID REFERENCES answer_sheets(id) ON DELETE CASCADE,
    question_num INT NOT NULL,
    extracted_text TEXT,
    ai_score FLOAT,
    teacher_score FLOAT,
    final_score FLOAT NOT NULL,
    confidence FLOAT,
    reasoning TEXT,
    strengths TEXT[],
    gaps TEXT[],
    teacher_override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Teachers can view/update their own profile
CREATE POLICY "Teachers can view own profile" ON teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers can update own profile" ON teachers FOR UPDATE USING (auth.uid() = id);

-- Parents can view/update their own profile
CREATE POLICY "Parents can view own profile" ON parents FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Parents can update own profile" ON parents FOR UPDATE USING (auth.uid() = id);

-- Trigger to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF new.raw_user_meta_data->>'role' = 'teacher' THEN
    INSERT INTO public.teachers (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  ELSIF new.raw_user_meta_data->>'role' = 'parent' THEN
    INSERT INTO public.parents (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
