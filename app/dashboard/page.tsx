import { createClient } from "@/lib/supabase/server"
import {
  FileText, Users, CheckCircle, Clock, ArrowUpRight, Sparkles,
  Activity, Zap, Layers, AlertTriangle, TrendingUp, TrendingDown,
  Calendar, GraduationCap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { UpcomingExams } from "@/components/dashboard/upcoming-exams"
import { SystemStatus } from "@/components/dashboard/system-status"
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

  // At Risk Students (Approximate)
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

  // 2. Priority Queue: Exams needing grading
  const { data: priorityQueue } = await supabase
    .from("answer_sheets")
    .select(`
      id, created_at, status, confidence,
      exams!inner (exam_name, class, subject),
      students!inner (name, roll_number)
    `)
    .in("status", ["pending", "graded"])
    .order("created_at", { ascending: true }) // Oldest first
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

  return (
    <div className="space-y-8 pb-24 lg:pb-0 animate-fade-in-up">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
            Dashboard
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse-glow shadow-sm" />
          </h2>
          <p className="text-muted-foreground font-medium mt-2 text-lg">
            Good Morning, Professor. You have <span className="text-foreground font-bold">{pendingCount} items</span> requiring attention.
          </p>
        </div>

        {/* Quick Action Button Group */}
        <div className="hidden md:flex gap-4">
          <Button asChild variant="default" className="rounded-full px-6 py-5 shadow-lg shadow-primary/25 hover:shadow-primary/40 text-base">
            <Link href="/dashboard/exams/create">
              <FileText size={20} />
              <span>Create Exam</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-full px-6 py-5 text-base border-border/50">
            <Link href="/dashboard/grading">
              <CheckCircle size={20} className="text-emerald-500" />
              <span>Grade All</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 1. Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Needs Review",
            val: pendingCount || 0,
            icon: Clock,
            color: "amber",
            trend: "+12%",
            trendUp: true
          },
          {
            label: "Total Students",
            val: studentCount || 0,
            icon: Users,
            color: "purple",
            trend: "+5 new",
            trendUp: true
          },
          {
            label: "At Risk",
            val: atRiskCount || 0,
            icon: AlertTriangle,
            color: "red",
            trend: "-2%",
            trendUp: false
          },
          {
            label: "Avg. Performance",
            val: "78%",
            icon: Activity,
            color: "teal",
            trend: "+4%",
            trendUp: true
          },
        ].map((s, i) => (
          <GlassCard key={i} variant="neu" hoverEffect className="p-5 flex items-center justify-between group">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{s.label}</p>
              <h3 className="text-3xl font-display font-bold text-foreground">{s.val}</h3>
              <div className={cn(
                "flex items-center gap-1 text-xs font-semibold mt-2",
                s.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {s.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.trend} <span className="text-muted-foreground font-normal ml-1">vs last week</span>
              </div>
            </div>
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center border",
              s.color === 'amber' && "bg-chart-4/10 text-chart-4 border-chart-4/20",
              s.color === 'purple' && "bg-chart-5/10 text-chart-5 border-chart-5/20",
              s.color === 'red' && "bg-destructive/10 text-destructive border-destructive/20",
              s.color === 'teal' && "bg-chart-2/10 text-chart-2 border-chart-2/20",
            )}>
              <s.icon size={26} />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 2. Priority Queue (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard variant="liquid" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Zap className="text-amber-500 fill-amber-500" size={20} />
                Priority Queue
              </h3>
              <Link href="/dashboard/grading" className="text-sm font-medium text-primary hover:underline">
                View Grading Queue &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {priorityQueue && priorityQueue.length > 0 ? (
                priorityQueue.map((item: any, i) => (
                  <div key={item.id} className="group flex items-center justify-between p-4 rounded-xl bg-secondary border border-border hover:border-border/80 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                        {item.students?.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.students?.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.exams?.subject} • {item.exams?.exam_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block shrink-0">
                        <span className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
                          item.status === 'graded' ? "bg-chart-3/10 text-chart-3 border-chart-3/20" : "bg-chart-4/10 text-chart-4 border-chart-4/20"
                        )}>
                          {item.status === 'graded' ? 'Review' : 'Grade'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className="h-10 w-10 shrink-0 rounded-full border border-border flex items-center justify-center bg-background group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                        role="button"
                        aria-label={`Grade submission for ${item.students?.name}`}
                      >
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-secondary/50 rounded-xl border border-dashed border-border">
                  <CheckCircle size={48} className="mx-auto mb-3 text-chart-3 opacity-50" />
                  <p>All caught up! No pending items.</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Performance Chart */}
          <GlassCard variant="neu" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Activity className="text-indigo-500" size={20} />
                Class Performance
              </h3>
            </div>
            <div className="h-16 w-full">
              <AnalyticsChart data={analyticsData} />
            </div>
          </GlassCard>
        </div>

        {/* 3. Sidebar (Right 1 col) */}
        <div className="space-y-6">

          {/* Quick Actions Card */}
          <GlassCard variant="liquid" className="p-6 relative overflow-hidden bg-primary/5 border-primary/20 hover:border-primary/40 transition-colors">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-primary">
                <Sparkles size={20} className="fill-primary/20" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="default" className="col-span-2 h-auto justify-start p-4 rounded-xl shadow-lg shadow-primary/20">
                  <Link href="/dashboard/exams/create">
                    <FileText size={20} />
                    <span className="font-semibold text-sm">New Exam</span>
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-[80px] flex-col rounded-xl border-border/50">
                  <Link href="/dashboard/students/add">
                    <Users size={24} className="mb-1 text-chart-1" />
                    <span className="font-semibold text-xs">Add Student</span>
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-[80px] flex-col rounded-xl border-border/50">
                  <Link href="/dashboard/settings">
                    <Layers size={24} className="mb-1 text-chart-2" />
                    <span className="font-semibold text-xs">Manage</span>
                  </Link>
                </Button>
              </div>
            </div>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          </GlassCard>

          {/* Recent Activity Feed */}
          <GlassCard variant="neu" className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              Recent Activity
            </h3>
            <div className="relative pl-4 space-y-6 border-l border-border/50">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-chart-3 border-2 border-background" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Graded <span className="font-bold text-primary">{activity.students?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.exams?.exam_name} • Score: {activity.total_score}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wide font-semibold">
                        {new Date(activity.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </div>
          </GlassCard>

          {/* System Status */}
          <GlassCard className="p-6">
            <SystemStatus />
          </GlassCard>

        </div>
      </div>
    </div>
  )
}
