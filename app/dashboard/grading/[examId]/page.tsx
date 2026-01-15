import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import StudentList from "./student-list"

export default async function ExamGradingPage({
    params,
}: {
    params: Promise<{ examId: string }>
}) {
    const { examId } = await params
    const supabase = await createClient()

    // 1. Fetch Exam Details
    const { data: exam } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single()

    if (!exam) {
        return <div>Exam not found</div>
    }

    // 2. Fetch All Students in the Exam's Class
    // Handle "10-A" format vs "10" and "A" columns
    let studentQuery = supabase
        .from("students")
        .select("id, name, roll_number, class, section")
        .order("roll_number")

    // Try to parse class and section from exam.class (e.g. "10-A", "10 A", "10A")
    // Regex to match: (Class)(Separator)(Section)
    const match = exam.class.match(/^(\d+)(?:[- ]?([a-zA-Z0-9]+))?$/)

    if (match) {
        const classNum = match[1]
        const section = match[2]

        if (section) {
            // If we have both, match (class=10 AND section=A) OR class="10-A"
            studentQuery = studentQuery.or(`and(class.eq.${classNum},section.eq.${section}),class.eq.${exam.class}`)
        } else {
            // Just class number found
            studentQuery = studentQuery.eq("class", classNum)
        }
    } else {
        // Fallback to exact match
        studentQuery = studentQuery.eq("class", exam.class)
    }

    const { data: students } = await studentQuery

    // 3. Fetch Existing Answer Sheets for this Exam
    const { data: answerSheets } = await supabase
        .from("answer_sheets")
        .select("id, student_id, status, total_score, confidence")
        .eq("exam_id", examId)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/grading">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{exam.exam_name}</h1>
                    <p className="text-muted-foreground">
                        {exam.subject} • Class {exam.class} • {new Date(exam.exam_date).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Student List</h2>
                    <div className="text-sm text-muted-foreground">
                        Total Students: {students?.length || 0}
                    </div>
                </div>

                <StudentList
                    examId={examId}
                    students={students || []}
                    answerSheets={answerSheets || []}
                />
            </div>
        </div>
    )
}
