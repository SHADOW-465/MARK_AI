-- 1. Fix Teachers/Parents Table Population (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (new.raw_user_meta_data->>'role' = 'teacher') THEN
    INSERT INTO public.teachers (id, email, name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Teacher'));
  ELSIF (new.raw_user_meta_data->>'role' = 'parent') THEN
    INSERT INTO public.parents (id, email, name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Parent'));
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users (Best effort)
INSERT INTO public.teachers (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Teacher')
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'teacher'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.parents (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Parent')
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'parent'
ON CONFLICT (id) DO NOTHING;


-- 2. Fix Orphaned Students
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id);

-- 3. Fix RLS Policies (Secure)

-- Drop insecure policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON exams;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON exams;
DROP POLICY IF EXISTS "Enable update for own exams" ON exams;
DROP POLICY IF EXISTS "Enable delete for own exams" ON exams;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON students;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON students;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON students;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON students;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON answer_sheets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON answer_sheets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON answer_sheets;

-- Secure Exams Policies
CREATE POLICY "Teachers can view own exams" ON exams
FOR SELECT TO authenticated USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own exams" ON exams
FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own exams" ON exams
FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own exams" ON exams
FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- Secure Students Policies
CREATE POLICY "Teachers can view own students" ON students
FOR SELECT TO authenticated USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own students" ON students
FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own students" ON students
FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own students" ON students
FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- Secure Answer Sheets Policies
CREATE POLICY "Teachers can view answer sheets for their exams" ON answer_sheets
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = answer_sheets.exam_id AND exams.teacher_id = auth.uid())
);

CREATE POLICY "Teachers can insert answer sheets for their exams" ON answer_sheets
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = answer_sheets.exam_id AND exams.teacher_id = auth.uid())
);

CREATE POLICY "Teachers can update answer sheets for their exams" ON answer_sheets
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM exams WHERE exams.id = answer_sheets.exam_id AND exams.teacher_id = auth.uid())
);

-- 4. Storage Policies for 'answer-sheets' bucket
-- Note: You must create the bucket 'answer-sheets' in Supabase dashboard if it doesn't exist.

-- Allow authenticated uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('answer-sheets', 'answer-sheets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload answer sheets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'answer-sheets');

CREATE POLICY "Authenticated users can view answer sheets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'answer-sheets');
