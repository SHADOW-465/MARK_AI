import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import StudentSplitView from "@/components/student/student-split-view"
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
    .eq("student_id", student.id)
    .single()

  if (!sheet) return notFound()

  if (sheet.status !== "approved") {
      return (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
              <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold">Report Not Ready</h1>
                  <p className="text-muted-foreground">This exam is still being graded. Check back later.</p>
                  <Link href="/student/grades">
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

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0f172a] shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/student/grades">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2 text-white">
              {sheet.exams.exam_name}
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                {sheet.total_score} / {sheet.exams.total_marks}
              </Badge>
            </h1>
            <p className="text-sm text-slate-500">
              {sheet.exams.subject} • {new Date(sheet.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      <StudentSplitView sheet={sheet} initialEvaluations={evaluations || []} />
    </div>
  )
}
