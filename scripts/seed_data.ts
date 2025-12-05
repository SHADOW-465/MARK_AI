import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log("Seeding data...")

  // 1. Create a Teacher (if not exists, we can't easily create auth users via API without admin,
  // but we can insert into public tables if they exist.
  // Ideally, we assume the user is logged in, but for seeding we might need to create dummy data linked to a placeholder ID or just generic data)

  // Let's create some Students
  const students = [
    { name: "Aarav Patel", roll_number: "101", class: "10", section: "A" },
    { name: "Vivaan Singh", roll_number: "102", class: "10", section: "A" },
    { name: "Aditya Sharma", roll_number: "103", class: "10", section: "A" },
    { name: "Vihaan Gupta", roll_number: "104", class: "10", section: "B" },
    { name: "Arjun Kumar", roll_number: "105", class: "10", section: "B" },
    { name: "Sai Iyer", roll_number: "106", class: "10", section: "B" },
    { name: "Reyansh Reddy", roll_number: "107", class: "10", section: "C" },
    { name: "Krishna Das", roll_number: "108", class: "10", section: "C" },
    { name: "Ishaan Malhotra", roll_number: "109", class: "10", section: "C" },
    { name: "Shaurya Verma", roll_number: "110", class: "10", section: "C" },
  ]

  const { data: insertedStudents, error: studentError } = await supabase
    .from("students")
    .upsert(students, { onConflict: "roll_number" })
    .select()

  if (studentError) {
    console.error("Error seeding students:", studentError)
  } else {
    console.log(`Seeded ${insertedStudents.length} students`)
  }

  // 2. Create some Exams (we need a valid teacher_id, but we can't guess it.
  // We will skip creating exams linked to specific users for now, or fetch the first user)

  const { data: users } = await supabase.auth.admin.listUsers()
  const teacherId = users.users[0]?.id

  if (teacherId) {
    const exams = [
      {
        teacher_id: teacherId,
        exam_name: "Mathematics Mid-Term",
        subject: "Mathematics",
        class: "10",
        exam_date: "2024-03-15",
        total_marks: 100,
        marking_precision: "whole",
        marking_scheme: [
          {
            question_num: 1,
            question_text: "Solve for x: 2x + 5 = 15",
            max_marks: 5,
            rubric: "2 marks for steps, 3 for answer",
            model_answer: "x = 5",
          },
          {
            question_num: 2,
            question_text: "Define Pythagoras Theorem",
            max_marks: 5,
            rubric: "Full marks for correct definition",
            model_answer: "a^2 + b^2 = c^2",
          },
        ],
      },
      {
        teacher_id: teacherId,
        exam_name: "Physics Unit Test 1",
        subject: "Physics",
        class: "10",
        exam_date: "2024-04-10",
        total_marks: 50,
        marking_precision: "half",
        marking_scheme: [
          {
            question_num: 1,
            question_text: "What is Newton's First Law?",
            max_marks: 10,
            rubric: "5 marks for definition, 5 for example",
            model_answer: "Inertia...",
          },
        ],
      },
    ]

    const { error: examError } = await supabase.from("exams").insert(exams)

    if (examError) {
      console.error("Error seeding exams:", examError)
    } else {
      console.log("Seeded exams")
    }
  } else {
    console.log("No users found, skipping exam seeding. Sign up first!")
  }

  console.log("Seeding complete!")
}

seed()
