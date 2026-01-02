import { createClient } from "@/lib/supabase/server"
import { FileText, Users, CheckCircle, Clock, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { UpcomingExams } from "@/components/dashboard/upcoming-exams"
import { SystemStatus } from "@/components/dashboard/system-status"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch real stats
  const { count: examCount } = await supabase.from("exams").select("*", { count: "exact", head: true })
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })
  const { count: gradedCount } = await supabase
    .from("answer_sheets")
    .select("*", { count: "exact", head: true })
    .eq("status", "graded")
  const { count: pendingCount } = await supabase
    .from("answer_sheets")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  // Fetch recent activity (latest exams)
  const { data: recentExams } = await supabase
    .from("exams")
    .select("exam_name, created_at")
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch upcoming exams
  const { data: upcomingExams } = await supabase
    .from("exams")
    .select("id, exam_name, exam_date, class")
    .gte("exam_date", new Date().toISOString().split('T')[0])
    .order("exam_date", { ascending: true })
    .limit(3)

  // Fetch data for analytics (Last 5 exams)
  const { data: analyticsExams } = await supabase
    .from("exams")
    .select("id, exam_name, passing_marks")
    .order("created_at", { ascending: false })
    .limit(5)

  const analyticsData = await Promise.all(
    (analyticsExams || []).map(async (exam) => {
      const { data: sheets } = await supabase
        .from("answer_sheets")
        .select("total_score")
        .eq("exam_id", exam.id)
        .not("total_score", "is", null)

      const total = sheets?.reduce((acc, sheet) => acc + (sheet.total_score || 0), 0) || 0
      const count = sheets?.length || 0
      const average = count > 0 ? Math.round(total / count) : 0

      return {
        name: exam.exam_name,
        average: average,
        passing: exam.passing_marks
      }
    })
  )

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground font-light mt-1">Welcome back! Here's your grading activity summary.</p>
        </div>
        <div className="hidden md:block">
          <span className="px-3 py-1 rounded-full bg-secondary border border-border text-xs font-mono text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">

        {/* Stat Cards - Refactored to use GlassCard and semantic colors */}
        {[
          {
            label: "Total Exams",
            val: examCount || 0,
            sub: "Exams Created",
            icon: FileText,
            colorClass: "text-cyan-500",
            bgClass: "bg-cyan-500/10",
            borderColor: "border-cyan-500/20"
          },
          {
            label: "Active Students",
            val: studentCount || 0,
            sub: "Total Enrolled",
            icon: Users,
            colorClass: "text-purple-500",
            bgClass: "bg-purple-500/10",
            borderColor: "border-purple-500/20"
          },
          {
            label: "Pending Review",
            val: pendingCount || 0,
            sub: "Needs Grading",
            icon: Clock,
            colorClass: "text-amber-500",
            bgClass: "bg-amber-500/10",
            borderColor: "border-amber-500/20"
          },
          {
            label: "Graded Sheets",
            val: gradedCount || 0,
            sub: "Completed",
            icon: CheckCircle,
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20"
          },
        ].map((s, i) => (
          <GlassCard key={i} hoverEffect className="p-6">
            <div className="flex flex-col h-full justify-between">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-full border", s.bgClass, s.borderColor, s.colorClass)}>
                  <s.icon size={16} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                <ArrowUpRight className={cn("ml-auto w-4 h-4 opacity-50 transition-opacity group-hover:opacity-100", s.colorClass)} />
              </div>

              {/* Main Value */}
              <div className="mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Count</span>
                <h3 className="text-4xl font-display font-bold text-foreground tracking-tight mt-1">{s.val}</h3>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <span className="text-xs text-muted-foreground">{s.sub}</span>
                <span className={cn("text-xs font-bold px-2 py-1 rounded", s.bgClass, s.colorClass)}>
                  View Details
                </span>
              </div>
            </div>
          </GlassCard>
        ))}

        {/* Analytics Chart - Spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <GlassCard className="p-6 flex flex-col min-h-[350px]">
            <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              Performance Analytics
            </h3>
            <div className="flex-1 w-full">
              <AnalyticsChart data={analyticsData} />
            </div>
          </GlassCard>
        </div>

        {/* Upcoming Exams - Spans 1 column */}
        <div className="md:col-span-1 lg:col-span-1">
          <GlassCard className="p-6 flex flex-col h-full">
            <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Upcoming Exams
            </h3>
            <UpcomingExams exams={upcomingExams || []} />
          </GlassCard>
        </div>

        {/* System Status - Spans 1 column */}
        <div className="md:col-span-1 lg:col-span-1">
          <GlassCard className="p-6 flex flex-col h-full">
            <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
              System Health
            </h3>
            <SystemStatus />
          </GlassCard>
        </div>

        {/* Quick Actions - Spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <GlassCard className="p-6 flex flex-col h-full">
            <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              <Link href="/dashboard/exams/create" className="group">
                <div className="h-full flex flex-col justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all">
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 w-fit mb-3">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-foreground group-hover:text-cyan-500 transition-colors">Create New Exam</span>
                    <span className="text-xs text-muted-foreground">Set up a new test paper</span>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-cyan-400 transition-colors self-end mt-2" />
                </div>
              </Link>
              <Link href="/dashboard/students/add" className="group">
                <div className="h-full flex flex-col justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:bg-purple-500/10 hover:border-purple-500/30 transition-all">
                  <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 w-fit mb-3">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-foreground group-hover:text-purple-500 transition-colors">Add Student</span>
                    <span className="text-xs text-muted-foreground">Register new students</span>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-400 transition-colors self-end mt-2" />
                </div>
              </Link>
              <Link href="/dashboard/grading" className="group">
                <div className="h-full flex flex-col justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all">
                  <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 w-fit mb-3">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">Review Pending Grades</span>
                    <span className="text-xs text-muted-foreground">Check ungraded sheets</span>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-400 transition-colors self-end mt-2" />
                </div>
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Recent Activity - Spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <GlassCard className="p-6 flex flex-col h-full">
            <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Recent Activity
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {recentExams && recentExams.length > 0 ? (
                recentExams.map((exam, i) => (
                  <div className="flex items-center p-4 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors group" key={i}>
                    <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-bold text-foreground group-hover:text-cyan-500 transition-colors">New Exam Created</p>
                      <p className="text-xs text-muted-foreground font-mono">{exam.exam_name}</p>
                    </div>
                    <div className="ml-auto font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-mono">No recent activity</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}
