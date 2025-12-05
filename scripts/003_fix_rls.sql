-- Enable RLS on tables
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_sheets ENABLE ROW LEVEL SECURITY;

-- Exams Policies
CREATE POLICY "Enable read access for authenticated users" ON exams
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON exams
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for own exams" ON exams
FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);

CREATE POLICY "Enable delete for own exams" ON exams
FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- Students Policies
CREATE POLICY "Enable read access for authenticated users" ON students
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON students
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON students
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON students
FOR DELETE TO authenticated USING (true);

-- Answer Sheets Policies
CREATE POLICY "Enable read access for authenticated users" ON answer_sheets
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON answer_sheets
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON answer_sheets
FOR UPDATE TO authenticated USING (true);
