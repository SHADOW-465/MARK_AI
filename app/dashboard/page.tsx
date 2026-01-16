import { createClient } from "@/lib/supabase/server"
import { FileText, Users, CheckCircle, Clock, ArrowUpRight, Sparkles, Activity, Zap } from "lucide-react"
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
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
            Dashboard
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse-glow" />
          </h2>
          <p className="text-muted-foreground font-light mt-2 text-lg">Mission Control for AI Grading</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Premium Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Stat Cards */}
        {[
          {
            label: "Total Exams",
            val: examCount || 0,
            sub: "Active Assessments",
            icon: FileText,
            color: "primary",
            gradient: "from-indigo-500 to-blue-600"
          },
          {
            label: "Enrolled Students",
            val: studentCount || 0,
            sub: "Learning Tracked",
            icon: Users,
            color: "purple",
            gradient: "from-purple-500 to-pink-600"
          },
          {
            label: "Pending Review",
            val: pendingCount || 0,
            sub: "Action Required",
            icon: Clock,
            color: "teal",
            gradient: "from-teal-400 to-emerald-500"
          },
          {
            label: "Graded Sheets",
            val: gradedCount || 0,
            sub: "Completed",
            icon: CheckCircle,
            color: "primary", // Fallback
            gradient: "from-blue-500 to-cyan-500"
          },
        ].map((s, i) => (
          <GlassCard 
            key={i} 
            variant="gradient" 
            hoverEffect 
            shimmer
            gradientColor={s.color as any}
            className="p-6 overflow-hidden relative group"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}>
                  <s.icon size={20} />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/10`}>
                  Real-time
                </div>
              </div>
              
              <div>
                <h3 className="text-4xl font-display font-bold text-foreground mb-1 group-hover:scale-105 transition-transform origin-left">
                  {s.val}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
          </GlassCard>
        ))}

        {/* Analytics Chart - Large Block */}
        <div className="md:col-span-2 lg:col-span-2 row-span-2">
          <GlassCard className="p-0 h-full flex flex-col overflow-hidden" hoverEffect>
            <div className="p-6 border-b border-border/50 bg-white/30 dark:bg-slate-900/30">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Performance Trends
              </h3>
              <p className="text-sm text-muted-foreground">Average scores across recent exams</p>
            </div>
            <div className="flex-1 p-6 w-full bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-900/10">
              <AnalyticsChart data={analyticsData} />
            </div>
          </GlassCard>
        </div>

        {/* Upcoming Exams */}
        <div className="md:col-span-1 lg:col-span-1 row-span-2">
          <GlassCard className="p-0 h-full flex flex-col" hoverEffect>
             <div className="p-6 border-b border-border/50 bg-white/30 dark:bg-slate-900/30">
              <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                Upcoming
              </h3>
              <p className="text-sm text-muted-foreground">Next scheduled assessments</p>
            </div>
            <div className="p-4 flex-1">
              <UpcomingExams exams={upcomingExams || []} />
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-1 lg:col-span-1">
          <GlassCard className="p-6 h-full flex flex-col justify-center gap-3 relative overflow-hidden group" variant="neo" hoverEffect>
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             
             <h3 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2 z-10">
               <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
               Quick Actions
             </h3>
             
             <div className="grid gap-2 z-10">
               <Link href="/dashboard/exams/create">
                 <div className="p-3 rounded-lg bg-secondary/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center justify-between group/item cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                       <FileText size={16} />
                     </div>
                     <span className="text-sm font-medium">New Exam</span>
                   </div>
                   <ArrowUpRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                 </div>
               </Link>
               
               <Link href="/dashboard/students/add">
                 <div className="p-3 rounded-lg bg-secondary/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all flex items-center justify-between group/item cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                       <Users size={16} />
                     </div>
                     <span className="text-sm font-medium">Add Student</span>
                   </div>
                   <ArrowUpRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                 </div>
               </Link>
             </div>
          </GlassCard>
        </div>

        {/* System Status */}
        <div className="md:col-span-1 lg:col-span-1">
           <GlassCard className="p-6 h-full flex flex-col" hoverEffect>
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
               System Health
            </h3>
            <SystemStatus />
          </GlassCard>
        </div>

        {/* Recent Activity - Full Width Bottom */}
        <div className="md:col-span-2 lg:col-span-4">
          <GlassCard className="p-0" hoverEffect>
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Latest actions across the platform</p>
              </div>
              <Link href="/dashboard/exams" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
               {recentExams && recentExams.length > 0 ? (
                recentExams.map((exam, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-transparent hover:border-border transition-all">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground line-clamp-1">{exam.exam_name}</p>
                      <p className="text-xs text-muted-foreground">Created on {new Date(exam.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
               ) : (
                 <div className="col-span-3 text-center py-8 text-muted-foreground">
                   No recent activity to show
                 </div>
               )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}
