import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, GraduationCap, TrendingUp, ChevronRight } from "lucide-react"

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get parent profile
  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!parent) {
    redirect("/auth/login")
  }

  // Get claimed children with their latest exam info
  const { data: children } = await supabase
    .from("parent_student_mapping")
    .select(`
      id,
      verified_at,
      students (
        id,
        name,
        roll_number,
        class
      )
    `)
    .eq("parent_id", parent.id)

  // Get recent exam scores for each child
  const childrenWithScores = await Promise.all(
    (children || []).map(async (child: any) => {
      const { data: recentExam } = await supabase
        .from("answer_sheets")
        .select(`
          total_score,
          exams (exam_name, total_marks)
        `)
        .eq("student_id", child.students.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      return {
        ...child,
        recentExam: recentExam || null,
      }
    })
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Children</h1>
          <p className="text-slate-400 mt-1">Monitor your children's academic progress</p>
        </div>
        <Link href="/parent/claim">
          <Button className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500">
            <UserPlus className="w-4 h-4 mr-2" />
            Claim Student
          </Button>
        </Link>
      </div>

      {/* Children List */}
      {childrenWithScores.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Children Linked</h3>
            <p className="text-slate-400 text-center max-w-md mb-6">
              Link your child's account using their Roll Number and Date of Birth to view their academic progress.
            </p>
            <Link href="/parent/claim">
              <Button className="bg-gradient-to-r from-blue-500 to-teal-400">
                <UserPlus className="w-4 h-4 mr-2" />
                Claim Your First Student
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {childrenWithScores.map((child: any) => (
            <Link key={child.id} href={`/parent/${child.students.id}`}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                        {child.students.name}
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        Roll: {child.students.roll_number} | Class {child.students.class}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  {child.recentExam ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                      <TrendingUp className="w-5 h-5 text-teal-400" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">Latest Exam</p>
                        <p className="text-sm text-white font-medium">{child.recentExam.exams.exam_name}</p>
                      </div>
                      <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                        {child.recentExam.total_score}/{child.recentExam.exams.total_marks}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                      <p className="text-sm text-slate-400">No exams graded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
