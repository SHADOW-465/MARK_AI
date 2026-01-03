import { createClient } from "@/lib/supabase/server"
import { LibraryClient } from "@/components/student/library-client"

export const dynamic = 'force-dynamic'

export default async function LearningLibrary() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Unauthorized</div>

    const { data: student } = await supabase
        .from("students")
        .select("id, name")
        .eq("user_id", user.id)
        .single()

    if (!student) return <div>Student not found</div>

    // 1. Fetch Tasks for Kanban (Missions)
    const { data: tasks } = await supabase
        .from("student_tasks")
        .select("*")
        .eq("student_id", student.id)
        .order("due_date", { ascending: true })

    // 2. Fetch Study Materials (Sources)
    const { data: materials } = await supabase
        .from("study_materials")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })

    // 3. Fetch Approved Answer Sheets (Graded Context)
    const { data: exams } = await supabase
        .from("answer_sheets")
        .select(`
            id,
            total_score,
            created_at,
            exams (exam_name, subject, total_marks)
        `)
        .eq("student_id", student.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-display font-bold text-foreground">Learning Library</h1>
                <p className="text-muted-foreground mt-1">Organize your missions and synthesize knowledge with AI.</p>
            </header>

            <LibraryClient
                studentId={student.id}
                initialTasks={tasks || []}
                initialMaterials={materials || []}
                initialExams={exams || []}
            />
        </div>
    )
}
