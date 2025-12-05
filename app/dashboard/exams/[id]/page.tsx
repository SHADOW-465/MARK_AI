import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function ExamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch exam details
  const { data: exam } = await supabase.from("exams").select("*").eq("id", id).single()

  if (!exam) {
    return <div>Exam not found</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam.exam_name}</h1>
          <p className="text-muted-foreground">
            {exam.subject} • Class {exam.class} • {new Date(exam.exam_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Future: Add Edit Button */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Total Marks</span>
            <div className="text-2xl font-bold">{exam.total_marks}</div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Passing Marks</span>
            <div className="text-2xl font-bold">{exam.passing_marks}</div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Marking Precision</span>
            <div className="text-2xl font-bold capitalize">{exam.marking_precision}</div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Questions</span>
            <div className="text-2xl font-bold">{exam.marking_scheme?.length || 0}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marking Scheme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {exam.marking_scheme?.map((question: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Question {question.question_num}</h3>
                  <Badge variant="secondary">{question.max_marks} Marks</Badge>
                </div>
                <p className="text-sm">{question.question_text}</p>

                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/30 p-3 rounded text-sm">
                    <span className="font-medium block mb-1">Model Answer:</span>
                    {question.model_answer}
                  </div>
                  <div className="bg-muted/30 p-3 rounded text-sm">
                    <span className="font-medium block mb-1">Rubric:</span>
                    {question.rubric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
