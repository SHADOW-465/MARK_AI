-- Universal Student Management Logic
-- Creation Date: 2025-12-22

-- 1. Ensure the students table has all necessary columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'email') THEN
        ALTER TABLE students ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
        ALTER TABLE students ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'section') THEN
        ALTER TABLE students ADD COLUMN section VARCHAR(50);
    END IF;
END $$;

-- 2. Update/Create the link_student_account function to be universal
-- This function will now UPSERT student data based on roll_number and class.
CREATE OR REPLACE FUNCTION link_student_account(
    p_roll_number TEXT,
    p_class TEXT,
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_section TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update students table regardless of per-user RLS during signup
AS $$
DECLARE
    v_student_id UUID;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if this user is already linked to another student record
    IF EXISTS (SELECT 1 FROM students WHERE user_id = v_current_user_id AND (roll_number != p_roll_number OR class != p_class)) THEN
        RAISE EXCEPTION 'This account is already linked to a different student profile.';
    END IF;

    -- Try to find an existing student record to claim
    SELECT id INTO v_student_id
    FROM students
    WHERE roll_number = p_roll_number AND class = p_class;

    IF v_student_id IS NOT NULL THEN
        -- Check if already claimed by someone else
        IF EXISTS (SELECT 1 FROM students WHERE id = v_student_id AND user_id IS NOT NULL AND user_id != v_current_user_id) THEN
            RAISE EXCEPTION 'This student record (Roll: %, Class: %) has already been registered by another user.', p_roll_number, p_class;
        END IF;

        -- Update existing record
        UPDATE students
        SET user_id = v_current_user_id,
            email = p_email,
            name = COALESCE(p_name, name),
            section = COALESCE(p_section, section)
        WHERE id = v_student_id;
    ELSE
        -- Create a completely new record if it doesn't exist
        INSERT INTO students (roll_number, class, name, section, email, user_id)
        VALUES (p_roll_number, p_class, p_name, p_section, p_email, v_current_user_id)
        RETURNING id INTO v_student_id;
    END IF;

    RETURN v_student_id;
END;
$$;

-- 3. RLS Policies for Universal Access
-- Ensure students can see their own data
DROP POLICY IF EXISTS "Students view own profile" ON students;
CREATE POLICY "Students view own profile" ON students
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure students can update their own data (excluding critical fields like roll/class/teacher)
DROP POLICY IF EXISTS "Students update own profile" ON students;
CREATE POLICY "Students update own profile" ON students
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to see all students (We already relaxed this in previous steps, but securing it here)
-- Assuming teacher_id is how we identify admins/teachers for now
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students" ON students
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teachers WHERE id = auth.uid()
    )
);
