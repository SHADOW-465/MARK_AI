import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { data: subject } = await admin
    .from("student_subjects")
    .select("*")
    .eq("id", id)
    .eq("student_id", student.id)
    .maybeSingle()
  if (!subject) return new NextResponse("Not found", { status: 404 })

  const { data: tasks } = await admin
    .from("student_tasks")
    .select("*")
    .eq("subject_id", id)
    .order("created_at", { ascending: false })

  const { data: sessions } = await admin
    .from("study_sessions")
    .select("*")
    .eq("subject_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  const { data: allSheets } = await admin
    .from("answer_sheets")
    .select(
      "id, total_score, created_at, exams(exam_name, total_marks, subject), feedback_analysis(exam_name, exam_subject, exam_total_marks)",
    )
    .eq("student_id", student.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  const examHistory = (allSheets || []).filter((s: any) => {
    const name = s.feedback_analysis?.[0]?.exam_subject || s.exams?.subject
    return name?.toLowerCase() === subject.name.toLowerCase()
  })

  const { data: guideSessions } = await admin
    .from("ai_guide_sessions")
    .select("id, title, session_type, last_active_at")
    .eq("student_id", student.id)
    .eq("subject_id", id)
    .order("last_active_at", { ascending: false })
    .limit(5)

  return NextResponse.json({ subject, tasks, sessions, exams: examHistory, guideSessions })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { error } = await admin
    .from("student_subjects")
    .delete()
    .eq("id", id)
    .eq("student_id", student.id)

  if (error) return new NextResponse("Error", { status: 500 })
  return new NextResponse(null, { status: 204 })
}
