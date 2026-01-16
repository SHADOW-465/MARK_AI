import { createClient } from "@/lib/supabase/server"
import { FileText, Users, CheckCircle, Clock, ArrowUpRight, Sparkles, Activity, Zap, Layers } from "lucide-react"
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
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse-glow shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
          </h2>
          <p className="text-muted-foreground font-medium mt-2 text-lg">Mission Control for AI Grading</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-semibold text-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Premium Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Stat Cards - LIQUID & SOFT UI */}
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
            variant="liquid" // New Liquid Variant
            hoverEffect 
            shimmer
            gradientColor={s.color as any}
            className="p-6 overflow-hidden relative group"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                {/* Neumorphic Icon Container */}
                <div className={`h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-br ${s.gradient} text-white shadow-xl shadow-indigo-500/20 ring-4 ring-white/10 dark:ring-black/10`}>
                  <s.icon size={24} strokeWidth={2.5} />
                </div>
                
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 shadow-sm`}>
                  Real-time
                </div>
              </div>
              
              <div>
                <h3 className="text-5xl font-display font-extrabold text-foreground mb-1 group-hover:scale-105 transition-transform origin-left drop-shadow-sm">
                  {s.val}
                </h3>
                <p className="text-sm font-semibold text-muted-foreground/80 tracking-wide">{s.label}</p>
              </div>
            </div>
            
            {/* Liquid Background Blob */}
            <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-gradient-to-br ${s.gradient} opacity-20 blur-3xl group-hover:scale-125 transition-transform duration-1000`} />
          </GlassCard>
        ))}

        {/* Analytics Chart - Large Block */}
        <div className="md:col-span-2 lg:col-span-2 row-span-2">
          <GlassCard className="p-0 h-full flex flex-col overflow-hidden" hoverEffect variant="neu">
            <div className="p-8 border-b border-border/10 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground">
                  Performance Trends
                </h3>
              </div>
              <p className="text-sm font-medium text-muted-foreground ml-11">Average scores across recent exams</p>
            </div>
            <div className="flex-1 p-6 w-full bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-900/10">
              <AnalyticsChart data={analyticsData} />
            </div>
          </GlassCard>
        </div>

        {/* Upcoming Exams */}
        <div className="md:col-span-1 lg:col-span-1 row-span-2">
          <GlassCard className="p-0 h-full flex flex-col" hoverEffect variant="neu">
             <div className="p-8 border-b border-border/10">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground">
                  Upcoming
                </h3>
              </div>
              <p className="text-sm font-medium text-muted-foreground ml-11">Next assessments</p>
            </div>
            <div className="p-6 flex-1">
              <UpcomingExams exams={upcomingExams || []} />
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-1 lg:col-span-1">
          <GlassCard className="p-6 h-full flex flex-col justify-center gap-4 relative overflow-hidden group" variant="liquid" hoverEffect>
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             
             <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2 z-10 pl-1">
               <Zap className="w-5 h-5 text-amber-500 fill-amber-500 drop-shadow-md" />
               Quick Actions
             </h3>
             
             <div className="grid gap-3 z-10">
               <Link href="/dashboard/exams/create">
                 <div className="p-3 pl-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-white/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-between group/item cursor-pointer shadow-sm hover:shadow-md">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                       <FileText size={16} />
                     </div>
                     <span className="text-sm font-semibold">New Exam</span>
                   </div>
                   <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0">
                     <ArrowUpRight size={12} className="text-indigo-500" />
                   </div>
                 </div>
               </Link>
               
               <Link href="/dashboard/students/add">
                 <div className="p-3 pl-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-white/20 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex items-center justify-between group/item cursor-pointer shadow-sm hover:shadow-md">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                       <Users size={16} />
                     </div>
                     <span className="text-sm font-semibold">Add Student</span>
                   </div>
                   <div className="h-6 w-6 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0">
                     <ArrowUpRight size={12} className="text-purple-500" />
                   </div>
                 </div>
               </Link>
             </div>
          </GlassCard>
        </div>

        {/* System Status */}
        <div className="md:col-span-1 lg:col-span-1">
           <GlassCard className="p-6 h-full flex flex-col" hoverEffect variant="neu">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
               <Layers className="w-5 h-5 text-emerald-500" />
               System Health
            </h3>
            <div className="flex-1 flex flex-col justify-center">
              <SystemStatus />
            </div>
          </GlassCard>
        </div>

        {/* Recent Activity - Full Width Bottom */}
        <div className="md:col-span-2 lg:col-span-4">
          <GlassCard className="p-0" hoverEffect variant="neu">
            <div className="p-8 border-b border-border/10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">Recent Activity</h3>
                <p className="text-sm font-medium text-muted-foreground">Latest actions across the platform</p>
              </div>
              <Link href="/dashboard/exams" className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 border border-border shadow-sm text-sm font-semibold text-primary hover:text-primary/80 hover:shadow-md transition-all">
                View All
              </Link>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
               {recentExams && recentExams.length > 0 ? (
                recentExams.map((exam, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-border transition-all shadow-sm hover:shadow-lg group">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{exam.exam_name}</p>
                      <p className="text-xs font-medium text-muted-foreground/80">Created on {new Date(exam.created_at).toLocaleDateString()}</p>
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
