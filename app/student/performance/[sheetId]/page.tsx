import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import StudentResultViewer from "./student-result-viewer"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function StudentExamReviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>
}) {
  const { sheetId } = await params
  const supabase = await createClient()

  // Verify User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect("/")

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!student) return redirect("/")

  // Fetch Sheet
  const { data: sheet } = await supabase
    .from("answer_sheets")
    .select(`
      *,
      exams (exam_name, subject, total_marks, marking_scheme)
    `)
    .eq("id", sheetId)
    .eq("student_id", student.id) // Security check
    .single()

  if (!sheet) return notFound()

  // If not approved, student shouldn't see details yet (unless you want to allow it?)
  // The user requirement says "after finalizing and sending the report", so likely valid only if approved.
  if (sheet.status !== "approved") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Report Not Ready</h1>
          <p className="text-muted-foreground">This exam is still being graded. Check back later.</p>
          <Link href="/student/performance">
            <Button variant="outline">Go Back</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { data: evaluations } = await supabase
    .from("question_evaluations")
    .select("*")
    .eq("answer_sheet_id", sheetId)
    .order("question_num", { ascending: true })

  // Fetch feedback_analysis data with exam metadata snapshot
  const { data: feedbackData } = await supabase
    .from("feedback_analysis")
    .select("exam_name, exam_subject, exam_total_marks, exam_marking_scheme, overall_feedback")
    .eq("answer_sheet_id", sheetId)
    .single()

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/student/performance">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              {feedbackData?.exam_name || sheet.exams?.exam_name || 'Exam Review'}
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                {sheet.total_score} / {feedbackData?.exam_total_marks || sheet.exams?.total_marks || '?'}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {feedbackData?.exam_subject || sheet.exams?.subject || 'General'} • {new Date(sheet.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      <StudentResultViewer sheet={sheet} evaluations={evaluations || []} feedbackData={feedbackData || undefined} />
    </div>
  )
}
