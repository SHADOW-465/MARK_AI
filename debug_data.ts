
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugData() {
    console.log("--- Debugging Data ---")

    // 1. Fetch all exams
    const { data: exams, error: examError } = await supabase
        .from("exams")
        .select("id, exam_name, class, subject")

    if (examError) {
        console.error("Error fetching exams:", examError)
    } else {
        console.log("\nExams found:", exams?.length)
        exams?.forEach(e => console.log(`- ${e.exam_name} (Class: '${e.class}', Subject: '${e.subject}') ID: ${e.id}`))
    }

    // 2. Fetch all students
    const { data: students, error: studentError } = await supabase
        .from("students")
        .select("id, name, class, roll_number")

    if (studentError) {
        console.error("Error fetching students:", studentError)
    } else {
        console.log("\nStudents found:", students?.length)
        // Group by class
        const studentsByClass: Record<string, number> = {}
        students?.forEach(s => {
            studentsByClass[s.class] = (studentsByClass[s.class] || 0) + 1
        })
        console.log("Student counts by class:", studentsByClass)

        // List first 5 students
        console.log("\nSample Students:")
        students?.slice(0, 5).forEach(s => console.log(`- ${s.name} (Class: '${s.class}')`))
    }
}

debugData()
