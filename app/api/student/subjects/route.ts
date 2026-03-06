import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const COLORS = [
  "#9b8cff", "#FE6B4B", "#22c55e", "#f59e0b",
  "#38bdf8", "#e879f9", "#fb7185", "#34d399",
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()

  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  // Get unique subject names from graded exams
  const { data: examRows } = await admin
    .from("answer_sheets")
    .select("exams(subject), feedback_analysis(exam_subject)")
    .eq("student_id", student.id)
    .eq("status", "approved")

  const subjectNamesFromExams = new Set<string>()
  ;(examRows || []).forEach((row: any) => {
    const name = row.feedback_analysis?.[0]?.exam_subject || row.exams?.subject
    if (name) subjectNamesFromExams.add(name.trim())
  })

  // Get existing subjects
  const { data: existing } = await admin
    .from("student_subjects").select("name, color").eq("student_id", student.id)

  const existingNames = new Set((existing || []).map((s: any) => s.name))

  // Insert missing auto-subjects
  const toInsert = [...subjectNamesFromExams]
    .filter((name) => !existingNames.has(name))
    .map((name, i) => ({
      student_id: student.id,
      name,
      color: COLORS[(existingNames.size + i) % COLORS.length],
      auto_created: true,
    }))

  if (toInsert.length > 0) {
    await admin.from("student_subjects").insert(toInsert)
  }

  // Fetch all subjects
  const { data: subjects } = await admin
    .from("student_subjects")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: true })

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Enrich each subject with stats
  const enriched = await Promise.all(
    (subjects || []).map(async (subject: any) => {
      // Avg exam score for this subject
      const { data: sheets } = await admin
        .from("answer_sheets")
        .select("total_score, exams(total_marks), feedback_analysis(exam_total_marks, exam_subject)")
        .eq("student_id", student.id)
        .eq("status", "approved")

      const subjectSheets = (sheets || []).filter((s: any) => {
        const name = s.feedback_analysis?.[0]?.exam_subject || (s.exams as any)?.subject
        return name?.toLowerCase() === subject.name.toLowerCase()
      })

      const avgScore =
        subjectSheets.length > 0
          ? Math.round(
              subjectSheets.reduce((acc: number, s: any) => {
                const total =
                  (s.exams as any)?.total_marks ||
                  s.feedback_analysis?.[0]?.exam_total_marks ||
                  100
                return acc + ((s.total_score || 0) / total) * 100
              }, 0) / subjectSheets.length,
            )
          : 0

      const { count: totalTasks } = await admin
        .from("student_tasks")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id)

      const { count: completedTasks } = await admin
        .from("student_tasks")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id)
        .eq("status", "completed")

      const { count: sessionCount } = await admin
        .from("study_sessions")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id)
        .gte("created_at", weekAgo)

      return {
        ...subject,
        avgScore,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        sessionCount: sessionCount || 0,
      }
    }),
  )

  return NextResponse.json({ subjects: enriched })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { name, color } = await req.json()
  if (!name?.trim()) return new NextResponse("Name required", { status: 400 })

  const { data: subject, error } = await admin
    .from("student_subjects")
    .insert({
      student_id: student.id,
      name: name.trim(),
      color: color || "#9b8cff",
      auto_created: false,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") return new NextResponse("Subject already exists", { status: 409 })
    return new NextResponse("Error", { status: 500 })
  }

  return NextResponse.json({ subject }, { status: 201 })
}
