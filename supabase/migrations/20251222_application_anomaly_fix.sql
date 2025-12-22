-- Application Anomaly Fixes
-- addressing "Student record not found" and missing dashboard results
-- Date: 2025-12-22

-- 1. Robust Student Linking (Normalize inputs)
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
    IF v_current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Normalize inputs: Trim and Lowercase
    v_norm_roll := TRIM(LOWER(p_roll_number));
    v_norm_class := TRIM(LOWER(p_class));

    -- Find student using normalized matching
    SELECT id INTO v_student_id
    FROM students
    WHERE TRIM(LOWER(roll_number)) = v_norm_roll 
      AND (
          TRIM(LOWER(class)) = v_norm_class 
          OR REPLACE(TRIM(LOWER(class)), ' ', '') = REPLACE(v_norm_class, ' ', '') -- Handle "10 A" vs "10A"
      )
    LIMIT 1;

    IF v_student_id IS NOT NULL THEN
        -- Check if already claimed
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
        -- Create new if truly missing
        INSERT INTO students (roll_number, class, name, section, email, user_id)
        VALUES (p_roll_number, p_class, p_name, p_section, p_email, v_current_user_id)
        RETURNING id INTO v_student_id;
    END IF;

    RETURN v_student_id;
END;
$$;

-- 2. Answer Sheets RLS (Missing Policies)
ALTER TABLE answer_sheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own answer sheets" ON answer_sheets;
CREATE POLICY "Students view own answer sheets" ON answer_sheets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM students 
        WHERE id = answer_sheets.student_id 
        AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers manage all answer sheets" ON answer_sheets;
CREATE POLICY "Teachers manage all answer sheets" ON answer_sheets
FOR ALL
USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid()) -- Simple teacher check
);

-- 3. Question Evaluations RLS & Schema
ALTER TABLE question_evaluations ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE question_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own evaluations" ON question_evaluations;
CREATE POLICY "Students view own evaluations" ON question_evaluations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM answer_sheets 
        JOIN students ON students.id = answer_sheets.student_id
        WHERE answer_sheets.id = question_evaluations.answer_sheet_id
        AND students.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers manage all evaluations" ON question_evaluations;
CREATE POLICY "Teachers manage all evaluations" ON question_evaluations
FOR ALL
USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())
);

-- 4. Student Table Policy refinement
-- Ensure teachers can see ALL students to upload grades
DROP POLICY IF EXISTS "Teachers view all students" ON students;
CREATE POLICY "Teachers view all students" ON students
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid())
);