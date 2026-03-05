import { createClient } from "@/lib/supabase/server"
import { Users, Clock, AlertTriangle, TrendingUp, BarChart3, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ChartCard } from "@/components/dashboard/chart-card"
import { ScheduleCard } from "@/components/dashboard/schedule-card"
import { DataTable } from "@/components/dashboard/data-table"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: examCount } = await supabase.from("exams").select("*", { count: "exact", head: true })
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })

  const { count: pendingCount } = await supabase
    .from("answer_sheets")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "graded"])

  const { data: lowScores } = await supabase
    .from("answer_sheets")
    .select("student_id, total_score, exams(total_marks)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50)

  let atRiskCount = 0
  if (lowScores) {
    const uniqueStudents = new Set()
    lowScores.forEach((s) => {
      const examsData = s.exams as any
      const total = examsData?.total_marks || 100
      if ((s.total_score || 0) / total < 0.6) {
        uniqueStudents.add(s.student_id)
      }
    })
    atRiskCount = uniqueStudents.size
  }

  const { data: priorityQueue } = await supabase
    .from("answer_sheets")
    .select(
      `
      id, created_at, status, confidence,
      exams!inner (exam_name, class, subject),
      students!inner (name, roll_number)
    `,
    )
    .in("status", ["pending", "graded"])
    .order("created_at", { ascending: true })
    .limit(5)

  const { data: recentActivity } = await supabase
    .from("answer_sheets")
    .select(
      `
      id, updated_at, total_score, status,
      exams!inner (exam_name),
      students!inner (name)
    `,
    )
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(5)

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
        average,
        passing: exam.passing_marks,
      }
    }),
  )

  const { data: upcomingExams } = await supabase
    .from("exams")
    .select("id, exam_name, exam_date, class, subject")
    .gte("exam_date", new Date().toISOString().split("T")[0])
    .order("exam_date", { ascending: true })
    .limit(4)

  const stats = [
    {
      title: "Needs Review",
      value: pendingCount || 0,
      subtitle: "submissions pending",
      icon: Clock,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Avg Test Score",
      value: "78%",
      subtitle: "across all exams",
      icon: TrendingUp,
      trend: "+3%",
      trendUp: true,
    },
    {
      title: "At Risk",
      value: atRiskCount,
      subtitle: "students below 60%",
      icon: AlertTriangle,
      trend: "-2",
      trendUp: false,
    },
    {
      title: "Total Students",
      value: studentCount || 0,
      subtitle: `across ${examCount || 0} exams`,
      icon: Users,
      trend: "+5",
      trendUp: true,
    },
  ]

  const scheduleItems = (upcomingExams || []).map((exam: any) => {
    const examDate = new Date(exam.exam_date)
    const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return {
      id: exam.id,
      title: exam.exam_name,
      subtitle: `${exam.subject} • ${exam.class}`,
      dateLabel: examDate.toLocaleDateString(),
      meta: daysLeft > 0 ? `${daysLeft}d` : "today",
      urgent: daysLeft <= 3,
    }
  })

  const queueRows = (priorityQueue || []).map((item: any) => ({
    student: item.students?.name || "Unknown",
    exam: item.exams?.exam_name || "Exam",
    status: item.status,
    subject: item.exams?.subject || "General",
  }))

  const activityRows = (recentActivity || []).slice(0, 4).map((activity: any) => ({
    student: activity.students?.name || "Unknown",
    exam: activity.exams?.exam_name || "Exam",
    score: activity.total_score || 0,
    updated: new Date(activity.updated_at).toLocaleDateString(),
  }))

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="dashboard-grid">
        <div className="col-span-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 xl:col-span-4">
          {stats.map((item) => (
            <StatsCard
              key={item.title}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              icon={item.icon}
              trend={item.trend}
              trendUp={item.trendUp}
            />
          ))}
        </div>

        <div className="col-span-4 lg:col-span-5">
          <ChartCard
            title="Class Performance"
            description="Average versus passing marks"
            action={
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/70 text-muted-foreground">
                <BarChart3 size={15} />
              </button>
            }
          >
            <AnalyticsChart data={analyticsData} />
          </ChartCard>
        </div>

        <div className="col-span-4 lg:col-span-3">
          <ScheduleCard title="Upcoming Exams" items={scheduleItems} />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="col-span-4 space-y-6 lg:col-span-8">
          <GlassCard className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Grading Queue</h3>
              <Link href="/dashboard/grading" className="text-xs font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <DataTable
              columns={[
                { key: "student", header: "Student" },
                { key: "exam", header: "Exam" },
                { key: "subject", header: "Subject" },
                { key: "status", header: "Status" },
              ]}
              rows={queueRows}
            />
          </GlassCard>
        </div>

        <div className="col-span-4 space-y-6 lg:col-span-4">
          <GlassCard className="relative overflow-hidden border-primary/25 bg-primary/90 p-6 text-primary-foreground">
            <div className="relative z-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] opacity-80">Quick Action</p>
              <h3 className="mb-2 text-xl font-bold">Create New Exam</h3>
              <p className="mb-5 text-sm opacity-85">Set up and publish a new assessment for your class.</p>
              <Button asChild variant="secondary" className="w-full bg-white text-primary hover:bg-white/95">
                <Link href="/dashboard/exams/create">
                  <Plus size={16} />
                  Get Started
                </Link>
              </Button>
            </div>
            <div className="pointer-events-none absolute -bottom-14 -right-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Recent Activity</h3>
            <DataTable
              columns={[
                { key: "student", header: "Student" },
                { key: "exam", header: "Exam" },
                { key: "score", header: "Score" },
                { key: "updated", header: "Updated" },
              ]}
              rows={activityRows}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

