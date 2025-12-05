import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, TrendingUp } from "lucide-react"

export default async function ResultsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <div>Please login</div>

  // 1. Get Parent ID
  // Note: In a real app, we'd handle the parent-student link properly.
  // For this MVP, we'll assume the logged-in user might be a parent linked to students.
  // Or if it's a student login (future), we'd filter by student_id.

  // Let's fetch all approved answer sheets for students linked to this parent
  // First, get parent record
  const { data: parent } = await supabase.from("parents").select("id").eq("id", user.id).single()

  let results: any[] = []

  if (parent) {
    // Get linked students
    const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", parent.id)

    const studentIds = links?.map((l) => l.student_id) || []

    if (studentIds.length > 0) {
      const { data: sheets } = await supabase
        .from("answer_sheets")
        .select(`
          *,
          exams (exam_name, subject, total_marks, exam_date),
          students (name, roll_number)
        `)
        .in("student_id", studentIds)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })

      results = sheets || []
    }
  } else {
    // Fallback for demo: If not a parent, maybe show all approved results (for testing)
    // In production, this would be strictly restricted.
    // For now, let's just show a message if no parent record found.
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
        <p className="text-muted-foreground">View detailed performance reports and feedback.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.length > 0
                ? Math.round(
                    results.reduce((acc, curr) => acc + (curr.total_score / curr.exams.total_marks) * 100, 0) /
                      results.length,
                  ) + "%"
                : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
          <CardDescription>List of all published exam results.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result) => {
                  const percentage = (result.total_score / result.exams.total_marks) * 100
                  let grade = "F"
                  if (percentage >= 90) grade = "A"
                  else if (percentage >= 80) grade = "B"
                  else if (percentage >= 70) grade = "C"
                  else if (percentage >= 60) grade = "D"

                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.students.name}</TableCell>
                      <TableCell>{result.exams.exam_name}</TableCell>
                      <TableCell>{result.exams.subject}</TableCell>
                      <TableCell>{new Date(result.exams.exam_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {result.total_score} / {result.exams.total_marks}
                      </TableCell>
                      <TableCell>
                        <Badge variant={grade === "A" || grade === "B" ? "default" : "secondary"}>{grade}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/results/${result.id}`}>
                          <Button variant="outline" size="sm">
                            View Report
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No results available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
