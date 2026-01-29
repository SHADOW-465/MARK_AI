import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileCheck, TrendingUp, ShieldAlert, GraduationCap, Award, BarChart3 } from "lucide-react"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check admin role
  const isAdmin = user.user_metadata?.role === "admin"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Fetch school-wide stats from view
  const { data: schoolStats } = await supabase
    .from("school_stats")
    .select("*")
    .single()

  // Fetch class performance from view
  const { data: classPerformance } = await supabase
    .from("class_performance")
    .select("*")
    .order("class", { ascending: true })

  const stats = schoolStats || {
    total_students: 0,
    active_students_7d: 0,
    total_exams: 0,
    total_answer_sheets: 0,
    graded_sheets: 0,
    avg_score: 0,
    high_plagiarism_count: 0,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">School Analytics</h1>
            <Badge className="bg-gradient-to-r from-blue-500 to-teal-400 text-white border-0">
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">School-wide performance metrics and insights</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.total_students}</p>
                <p className="text-xs text-muted-foreground">{stats.active_students_7d} active this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams Graded */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sheets Graded</p>
                <p className="text-2xl font-bold text-foreground">{stats.graded_sheets}</p>
                <p className="text-xs text-muted-foreground">of {stats.total_answer_sheets} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(stats.avg_score || 0)}</p>
                <p className="text-xs text-muted-foreground">across all exams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plagiarism Flags */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plagiarism Flags</p>
                <p className="text-2xl font-bold text-foreground">{stats.high_plagiarism_count}</p>
                <p className="text-xs text-muted-foreground">&gt;60% similarity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Table */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-foreground">Class Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!classPerformance || classPerformance.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No class data available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Class</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Exams</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Highest</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Lowest</th>
                  </tr>
                </thead>
                <tbody>
                  {classPerformance.map((cls: any, index: number) => (
                    <tr 
                      key={cls.class} 
                      className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${index % 2 === 0 ? 'bg-muted/5' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{cls.class}</span>
                          </div>
                          <span className="font-medium text-foreground">Class {cls.class}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-foreground">{cls.student_count}</td>
                      <td className="py-3 px-4 text-center text-foreground">{cls.exam_count}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getScoreBadgeClass(cls.avg_score)}>
                          {Math.round(cls.avg_score || 0)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-green-400 font-medium">{Math.round(cls.highest_score || 0)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-red-400 font-medium">{Math.round(cls.lowest_score || 0)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Top Performing Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classPerformance && classPerformance.length > 0 ? (
              (() => {
                const topClass = [...classPerformance].sort((a: any, b: any) => (b.avg_score || 0) - (a.avg_score || 0))[0]
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">Class {topClass.class}</p>
                      <p className="text-muted-foreground">{topClass.student_count} students</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-amber-400">{Math.round(topClass.avg_score || 0)}</p>
                      <p className="text-sm text-muted-foreground">avg score</p>
                    </div>
                  </div>
                )
              })()
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              Grading Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="text-foreground font-bold">
                  {stats.total_answer_sheets > 0 
                    ? Math.round((stats.graded_sheets / stats.total_answer_sheets) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all"
                  style={{ 
                    width: `${stats.total_answer_sheets > 0 
                      ? Math.round((stats.graded_sheets / stats.total_answer_sheets) * 100) 
                      : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.graded_sheets} of {stats.total_answer_sheets} sheets graded
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getScoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30"
  if (score >= 60) return "bg-blue-500/20 text-blue-400 border-blue-500/30"
  if (score >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  return "bg-red-500/20 text-red-400 border-red-500/30"
}
