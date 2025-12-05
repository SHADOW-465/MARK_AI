-- Enable RLS on question_evaluations
ALTER TABLE question_evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view evaluations for their exams
CREATE POLICY "Teachers can view evaluations for their exams" ON question_evaluations
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM answer_sheets
    JOIN exams ON answer_sheets.exam_id = exams.id
    WHERE answer_sheets.id = question_evaluations.answer_sheet_id
    AND exams.teacher_id = auth.uid()
  )
);

-- Policy: Teachers can insert evaluations for their exams
CREATE POLICY "Teachers can insert evaluations for their exams" ON question_evaluations
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM answer_sheets
    JOIN exams ON answer_sheets.exam_id = exams.id
    WHERE answer_sheets.id = question_evaluations.answer_sheet_id
    AND exams.teacher_id = auth.uid()
  )
);

-- Policy: Teachers can update evaluations for their exams
CREATE POLICY "Teachers can update evaluations for their exams" ON question_evaluations
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM answer_sheets
    JOIN exams ON answer_sheets.exam_id = exams.id
    WHERE answer_sheets.id = question_evaluations.answer_sheet_id
    AND exams.teacher_id = auth.uid()
  )
);

-- Policy: Teachers can delete evaluations for their exams
CREATE POLICY "Teachers can delete evaluations for their exams" ON question_evaluations
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM answer_sheets
    JOIN exams ON answer_sheets.exam_id = exams.id
    WHERE answer_sheets.id = question_evaluations.answer_sheet_id
    AND exams.teacher_id = auth.uid()
  )
);
