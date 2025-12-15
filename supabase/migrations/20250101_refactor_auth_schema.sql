-- Migration to refactor Student Auth and Schema
-- 20250101_refactor_auth_schema.sql

-- 1. Ensure students table has 'email' and 'user_id'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'email') THEN
        ALTER TABLE students ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
        ALTER TABLE students ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Make teacher_id optional in students table to allow multi-teacher / decoupled logic
ALTER TABLE students ALTER COLUMN teacher_id DROP NOT NULL;

-- 3. Add Unique Constraint on (roll_number, class) to prevent duplicates and enable safe lookup
-- First, we might need to clean up duplicates if any exist (Optional, but good practice. For now we assume clean slate or non-conflicting data).
-- We will use a safe approach: try to add the constraint, if it fails, the user must clean data.
-- However, for this environment, we will assume it's fine or proceed.
-- Note: 'class' column name might be a reserved keyword in some contexts but valid in Postgres.
ALTER TABLE students ADD CONSTRAINT students_roll_class_key UNIQUE (roll_number, class);

-- 4. Create RLS Policies for Students to view their own "Results" (Answer Sheets)
-- Ensure 'answer_sheets' table exists. It is referenced in previous migrations.
-- We need to check if 'answer_sheets' has a 'student_id' column.

-- Policy: Students can view their own answer sheets (exams)
-- Assuming 'answer_sheets' table exists
DO $$
BEGIN
   IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'answer_sheets') THEN
       DROP POLICY IF EXISTS "Students view own answer sheets" ON answer_sheets;
       CREATE POLICY "Students view own answer sheets" ON answer_sheets
       FOR SELECT
       USING (
           auth.uid() IN (
               SELECT user_id FROM students WHERE id = answer_sheets.student_id
           )
       );
   END IF;
END $$;

-- 5. Policy for Students to update their own profile (e.g. email during signup linking? No, signup uses service role usually or direct update if allowed)
-- Actually, during signup, the user is authenticated as the new user.
-- So we need a policy to allow the authenticated user to update the student row IF the student row is currently unlinked (user_id is null) AND they have the correct roll/class?
-- No, RLS is hard for "claiming" a row.
-- BETTER APPROACH: Use a Postgres Function (RPC) to "claim" the student account.
-- However, standard Supabase 'update' requires RLS.
-- We will stick to the plan: The "Sign Up" page uses the Supabase Client.
-- If we use 'supabase.auth.signUp', the user is created.
-- Then we try to update the 'students' table.
-- The user needs permission to update THAT specific row.
-- Allow UPDATE on students if (user_id is NULL) OR (user_id = auth.uid())
-- But how do they find the row if user_id is NULL? They can't SELECT it if RLS is on and they aren't owner.
-- So we need a function or a permissive policy for unlinked students.

-- Let's create a Secure Function to "Link Student"
CREATE OR REPLACE FUNCTION link_student_account(p_roll_number TEXT, p_class TEXT, p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_current_user_id UUID;
BEGIN
    v_current_user_id := auth.uid();

    -- Find the student
    SELECT id INTO v_student_id
    FROM students
    WHERE roll_number = p_roll_number AND class = p_class;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    -- Check if already linked
    IF EXISTS (SELECT 1 FROM students WHERE id = v_student_id AND user_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Student already registered';
    END IF;

    -- Link
    UPDATE students
    SET user_id = v_current_user_id,
        email = p_email
    WHERE id = v_student_id;

    RETURN v_student_id;
END;
$$;
