import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { ArrowUpRight, Target, Brain, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch Student Data
  const { data: student } = await supabase
    .from("students")
    .select("id, name, class")
    .eq("user_id", user?.id) // Assuming we linked them
    .single()

  // Fetch Recent Feedback (Focus Engine)
  let focusItems: any[] = []
  let whyItems: any[] = []

  if (student) {
      const { data: feedback } = await supabase
        .from("feedback_analysis")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (feedback && feedback.length > 0) {
          const latest = feedback[0]
          // ROI Items
          if (latest.roi_analysis) {
              focusItems = Array.isArray(latest.roi_analysis) ? latest.roi_analysis.slice(0, 3) : []
          }
          // Real World Application
          if (latest.real_world_application) {
              whyItems.push({
                  title: "Real World Context",
                  desc: latest.real_world_application,
                  topic: latest.focus_areas?.[0] || "General"
              })
          }
      }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            {student ? `Welcome back, ${student.name.split(' ')[0]}` : "Welcome back"}
        </h1>
        <p className="text-muted-foreground mt-1">
            Here is your personalized briefing for today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* The Focus Engine (ROI) */}
        <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Target className="text-neon-cyan" />
                        The Focus Engine
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground border border-white/10 px-2 py-1 rounded">
                        HIGH ROI TASKS
                    </span>
                </div>

                <div className="space-y-4">
                    {focusItems.length > 0 ? (
                        focusItems.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon-cyan/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-neon-cyan/10 flex items-center justify-center text-neon-cyan font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{item.topic}</h4>
                                        <p className="text-sm text-muted-foreground">Est. Gain: <span className="text-neon-green">+{item.potential_gain} marks</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                                        item.effort === 'Low' ? 'bg-green-500/20 text-green-400' :
                                        item.effort === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {item.effort} Effort
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No recent analysis found. Complete an exam to activate the Focus Engine.</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Vitality Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <Brain size={16} /> Mastery Score
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        -- <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <Zap size={16} /> Focus Hours
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        0 <span className="text-sm font-normal text-muted-foreground">hrs</span>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <TrendingUp size={16} /> Efficiency
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        -- <span className="text-sm font-normal text-muted-foreground">%</span>
                    </div>
                </GlassCard>
            </div>
        </div>

        {/* The "Why" Widget */}
        <div className="lg:col-span-1">
            <GlassCard className="h-full p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-neon-purple/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Brain className="text-neon-purple" />
                    Why it Matters
                </h3>

                <div className="flex-1 space-y-6">
                    {whyItems.length > 0 ? (
                        whyItems.map((item, i) => (
                            <div key={i} className="relative z-10">
                                <span className="text-xs font-mono text-neon-purple mb-2 block uppercase tracking-wider">
                                    {item.topic}
                                </span>
                                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p className="text-sm">Context will appear here after your first analysis.</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6">
                    <Link href="/student/study" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                        <span className="text-sm font-medium">Open Knowledge Base</span>
                        <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                    </Link>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  )
}
