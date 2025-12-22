-- Student Registration Fix & Selective Updates
-- Date: 2025-12-22

-- 1. Drop old versions of the function to avoid signature overloading issues
DROP FUNCTION IF EXISTS link_student_account(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS link_student_account(TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. Create the robust universal linking function
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
    v_existing_name TEXT;
    v_existing_section TEXT;
    v_existing_email TEXT;
BEGIN
    v_current_user_id := auth.uid();

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Try to find the student record
    SELECT id, name, section, email INTO v_student_id, v_existing_name, v_existing_section, v_existing_email
    FROM students
    WHERE roll_number = p_roll_number AND class = p_class;

    -- 2. Handle missing student
    IF v_student_id IS NULL THEN
        -- Create new student if they don't exist at all
        INSERT INTO students (roll_number, class, name, section, email, user_id)
        VALUES (p_roll_number, p_class, p_name, p_section, p_email, v_current_user_id)
        RETURNING id INTO v_student_id;
        RETURN v_student_id;
    END IF;

    -- 3. Handle existing student record
    -- If already linked to another user, block it
    IF EXISTS (SELECT 1 FROM students WHERE id = v_student_id AND user_id IS NOT NULL AND user_id != v_current_user_id) THEN
        RAISE EXCEPTION 'This student record (Roll: %, Class: %) is already linked to another account.', p_roll_number, p_class;
    END IF;

    -- 4. Selective Update (Only update if currently missing/empty)
    UPDATE students
    SET user_id = v_current_user_id,
        name = CASE 
            WHEN (v_existing_name IS NULL OR v_existing_name = '') THEN p_name 
            ELSE v_existing_name 
        END,
        section = CASE 
            WHEN (v_existing_section IS NULL OR v_existing_section = '') THEN p_section 
            ELSE v_existing_section 
        END,
        email = CASE 
            WHEN (v_existing_email IS NULL OR v_existing_email = '') THEN p_email 
            ELSE v_existing_email 
        END
    WHERE id = v_student_id;

    RETURN v_student_id;
END;
$$;
