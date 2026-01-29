import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, GraduationCap, TrendingUp, Award, Calendar } from "lucide-react"

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verify parent has access to this student
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!parent) {
    redirect("/auth/login")
  }

  const { data: mapping } = await supabase
    .from("parent_student_mapping")
    .select("id")
    .eq("parent_id", parent.id)
    .eq("student_id", studentId)
    .single()

  if (!mapping) {
    notFound()
  }

  // Fetch student details
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single()

  if (!student) {
    notFound()
  }

  // Fetch exam history
  const { data: exams } = await supabase
    .from("answer_sheets")
    .select(`
      id,
      total_score,
      status,
      created_at,
      exams (exam_name, subject, total_marks)
    `)
    .eq("student_id", studentId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalExams = exams?.length || 0
  const avgScore = totalExams > 0
    ? Math.round(exams!.reduce((sum, e: any) => sum + (e.total_score / e.exams.total_marks) * 100, 0) / totalExams)
    : 0
  const bestScore = totalExams > 0
    ? Math.max(...exams!.map((e: any) => Math.round((e.total_score / e.exams.total_marks) * 100)))
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/parent">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{student.name}</h1>
          <p className="text-slate-400">Roll: {student.roll_number} | Class {student.class}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Exams</p>
                <p className="text-2xl font-bold text-white">{totalExams}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Average Score</p>
                <p className="text-2xl font-bold text-white">{avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Best Score</p>
                <p className="text-2xl font-bold text-white">{bestScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam History */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Exam History</CardTitle>
        </CardHeader>
        <CardContent>
          {!exams || exams.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No graded exams yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam: any) => {
                const percentage = Math.round((exam.total_score / exam.exams.total_marks) * 100)
                const getColor = (p: number) => {
                  if (p >= 80) return "bg-green-500/20 text-green-400 border-green-500/30"
                  if (p >= 60) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  if (p >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  return "bg-red-500/20 text-red-400 border-red-500/30"
                }

                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{exam.exams.exam_name}</h4>
                      <p className="text-sm text-slate-400">
                        {exam.exams.subject} | {new Date(exam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300">
                        {exam.total_score}/{exam.exams.total_marks}
                      </span>
                      <Badge className={getColor(percentage)}>
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
