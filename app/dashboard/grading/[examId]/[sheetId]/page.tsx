import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import GradingInterface from "./grading-interface"

export default async function GradingReviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>
}) {
  const { sheetId } = await params
  const supabase = await createClient()

  // Fetch all necessary data
  const { data: sheet } = await supabase
    .from("answer_sheets")
    .select(`
      *,
      students (name, roll_number),
      exams (exam_name, subject, total_marks, marking_scheme)
    `)
    .eq("id", sheetId)
    .single()

  if (!sheet) {
    return <div>Answer sheet not found</div>
  }

  const { data: evaluations } = await supabase
    .from("question_evaluations")
    .select("*")
    .eq("answer_sheet_id", sheetId)
    .order("question_num", { ascending: true })

  console.log("--- DEBUG GRADING REVIEW PAGE ---")
  console.log("Sheet ID:", sheetId)
  console.log("Sheet Found:", !!sheet)
  console.log("Evaluations Count:", evaluations?.length)
  if (evaluations?.length === 0) {
    console.log("WARNING: No evaluations found for this sheet.")
  }
  // ---------------------------------------------

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/grading/${sheet.exam_id}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              {sheet.students.name}
              <Badge variant="outline">{sheet.students.roll_number}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {sheet.exams.exam_name} • {sheet.exams.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={sheet.status === "approved" ? "default" : sheet.status === "graded" ? "secondary" : "outline"}
          >
            {sheet.status.toUpperCase()}
          </Badge>
        </div>
      </header>

      <GradingInterface sheet={sheet} initialEvaluations={evaluations || []} />
    </div>
  )
}
