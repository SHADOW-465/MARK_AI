import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Download } from "lucide-react"
import Link from "next/link"

export default async function ResultDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sheet } = await supabase
    .from("answer_sheets")
    .select(`
      *,
      students (name, roll_number, class, section),
      exams (exam_name, subject, total_marks, exam_date, marking_scheme)
    `)
    .eq("id", id)
    .single()

  if (!sheet) return <div>Result not found</div>

  const { data: evaluations } = await supabase
    .from("question_evaluations")
    .select("*")
    .eq("answer_sheet_id", id)
    .order("question_num", { ascending: true })

  const percentage = Math.round((sheet.total_score / sheet.exams.total_marks) * 100)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/results">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Report</h1>
            <p className="text-muted-foreground">
              {sheet.exams.exam_name} • {new Date(sheet.exams.exam_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{sheet.students.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-medium">{sheet.students.roll_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-medium">
                {sheet.students.class} - {sheet.students.section}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{sheet.exams.subject}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-bold text-primary mb-2">
              {sheet.total_score}
              <span className="text-2xl text-muted-foreground font-normal">/{sheet.exams.total_marks}</span>
            </div>
            <Badge className="text-lg px-4 py-1">{percentage}%</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher's Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg border">
            <p className="text-sm leading-relaxed">
              {sheet.gemini_response?.overall_feedback || "No feedback provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {evaluations?.map((ev) => {
              const question = sheet.exams.marking_scheme.find((q: any) => q.question_num === ev.question_num)
              const scorePercent = (ev.final_score / question?.max_marks) * 100

              return (
                <div key={ev.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">Question {ev.question_num}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{question?.question_text}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {ev.final_score}{" "}
                        <span className="text-sm text-muted-foreground font-normal">/ {question?.max_marks}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1 text-muted-foreground">Your Answer:</p>
                      <p className="bg-muted/30 p-2 rounded italic">{ev.extracted_text || "No text extracted"}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1 text-muted-foreground">Feedback:</p>
                      <p className={scorePercent < 50 ? "text-destructive" : "text-green-600"}>{ev.reasoning}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
