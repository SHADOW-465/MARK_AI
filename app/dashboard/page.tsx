import { createClient } from "@/lib/supabase/server"
import {
  FileText, Users, CheckCircle, Clock, ArrowUpRight, Sparkles,
  Activity, AlertTriangle, TrendingUp, TrendingDown,
  Calendar, GraduationCap, Plus, BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Fetch Key Stats
  const { count: examCount } = await supabase.from("exams").select("*", { count: "exact", head: true })
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })

  // Pending Reviews
  const { count: pendingCount } = await supabase
    .from("answer_sheets")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "graded"])

  // At Risk Students
  const { data: lowScores } = await supabase
    .from("answer_sheets")
    .select("student_id, total_score, exams(total_marks)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50)

  let atRiskCount = 0
  if (lowScores) {
    const uniqueStudents = new Set()
    lowScores.forEach(s => {
      const examsData = s.exams as any
      const total = examsData?.total_marks || 100
      if ((s.total_score || 0) / total < 0.6) {
        uniqueStudents.add(s.student_id)
      }
    })
    atRiskCount = uniqueStudents.size
  }

  // 2. Priority Queue
  const { data: priorityQueue } = await supabase
    .from("answer_sheets")
    .select(`
      id, created_at, status, confidence,
      exams!inner (exam_name, class, subject),
      students!inner (name, roll_number)
    `)
    .in("status", ["pending", "graded"])
    .order("created_at", { ascending: true })
    .limit(5)

  // 3. Recent Activity
  const { data: recentActivity } = await supabase
    .from("answer_sheets")
    .select(`
      id, updated_at, total_score, status,
      exams!inner (exam_name),
      students!inner (name)
    `)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(5)

  // 4. Analytics Data
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

  // 5. Upcoming Exams
  const { data: upcomingExams } = await supabase
    .from("exams")
    .select("id, exam_name, exam_date, class, subject")
    .gte("exam_date", new Date().toISOString().split('T')[0])
    .order("exam_date", { ascending: true })
    .limit(4)

  // Stat cards data
  const stats = [
    {
      label: "Needs Review",
      val: pendingCount || 0,
      sub: "submissions pending",
      icon: Clock,
      trend: "+12%",
      trendUp: true
    },
    {
      label: "Avg Test Score",
      val: "78%",
      sub: "across all exams",
      icon: TrendingUp,
      trend: "+3% vs last month",
      trendUp: true
    },
    {
      label: "At Risk",
      val: atRiskCount,
      sub: "students below 60%",
      icon: AlertTriangle,
      trend: "-2",
      trendUp: false
    },
    {
      label: "Total Students",
      val: studentCount || 0,
      sub: `across ${examCount || 0} exams`,
      icon: Users,
      trend: "+5 new",
      trendUp: true
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── ROW 1: Stats (2x2) + Chart + Schedule ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Stat Cards — 2x2 grid, spanning 4 columns */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <GlassCard key={i} className="p-5 flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <Link href="/dashboard/grading" className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">{s.val}</h3>
              <p className={cn(
                "text-xs font-medium mt-2",
                s.trendUp ? "text-emerald-400" : "text-red-400"
              )}>
                {s.trend} <span className="text-muted-foreground font-normal">vs last month</span>
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Performance Chart — spanning 5 columns */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Class Performance</h3>
              <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                <BarChart3 size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-[200px]">
              <AnalyticsChart data={analyticsData} />
            </div>
          </GlassCard>
        </div>

        {/* Schedule — spanning 3 columns */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
              <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                <Calendar size={16} />
              </button>
            </div>
            <div className="flex-1 space-y-3">
              {upcomingExams && upcomingExams.length > 0 ? upcomingExams.map((exam: any) => {
                const examDate = new Date(exam.exam_date)
                const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={exam.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/20 transition-colors group">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                      <span className="text-[9px] uppercase tracking-wider">{examDate.toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm leading-none">{examDate.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{exam.exam_name}</p>
                      <p className="text-[11px] text-muted-foreground">{exam.subject} • {exam.class}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md shrink-0",
                      daysLeft <= 3 ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"
                    )}>
                      {daysLeft > 0 ? `${daysLeft}d` : 'Today'}
                    </span>
                  </div>
                )
              }) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                  <Calendar size={32} className="mb-2 opacity-30" />
                  <p className="text-xs">No upcoming exams</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── ROW 2: Grading Queue + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Priority Queue — spanning 8 columns */}
        <div className="lg:col-span-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Grading Queue</h3>
              <Link href="/dashboard/grading" className="text-xs font-medium text-primary hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {priorityQueue && priorityQueue.length > 0 ? (
                priorityQueue.map((item: any) => (
                  <Link key={item.id} href={`/dashboard/grading`} className="block">
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/60 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {item.students?.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {item.students?.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.exams?.subject} • {item.exams?.exam_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          item.status === 'graded'
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        )}>
                          {item.status === 'graded' ? 'Review' : 'Grade'}
                        </span>
                        <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500/40" />
                  <p className="text-sm">All caught up! No pending items.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions — spanning 4 columns, featured card style */}
        <div className="lg:col-span-4 space-y-6">
          {/* Featured Card — light accent like the reference */}
          <div className="rounded-2xl bg-primary/90 p-6 text-primary-foreground relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Quick Action</span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase">New</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Create New Exam</h3>
              <p className="text-sm opacity-80 mb-6 leading-relaxed">
                Set up an exam, add questions, and start grading with AI assistance.
              </p>
              <Button asChild variant="secondary" className="w-full rounded-xl bg-white text-primary hover:bg-white/90 font-bold shadow-md">
                <Link href="/dashboard/exams/create">
                  <Plus size={18} />
                  Get Started
                </Link>
              </Button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Activity Feed */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              Recent Activity
            </h3>
            <div className="relative pl-4 space-y-4 border-l border-border/50">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 4).map((activity: any) => (
                  <div key={activity.id} className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Graded <span className="font-bold text-primary">{activity.students?.name}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {activity.exams?.exam_name} • {activity.total_score} pts
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
