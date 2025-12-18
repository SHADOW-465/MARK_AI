import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { ArrowUpRight, Target, Brain, TrendingUp, Zap, ArrowRight, Play } from "lucide-react"
import Link from "next/link"
import { ChallengeModeToggle } from "@/components/dashboard/challenge-mode-toggle"
import { MarkRecoveryWidget } from "@/components/dashboard/mark-recovery-widget"
import { cn } from "@/lib/utils"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  // Fetch Student Data
  const { data: student } = await supabase
    .from("students")
    .select("id, name, class, challenge_mode")
    .eq("user_id", user.id)
    .single()

  if (!student) return <div>Student record not found</div>

  // 1. NBA Hero: Query Tasks sorted by impact (metadata->priority_weight)
  let nbaTask = null
  const { data: nbaTasks } = await supabase
    .from("student_tasks")
    .select("*")
    .eq("student_id", student.id)
    .eq("status", "pending")
    .eq("priority", "High")
    .limit(5)

  if (nbaTasks && nbaTasks.length > 0) {
      nbaTask = nbaTasks.sort((a, b) => {
          const wA = a.metadata?.priority_weight || 0
          const wB = b.metadata?.priority_weight || 0
          return wB - wA
      })[0]
  }

  // 2. Mark Recovery Stats (From latest APPROVED feedback)
  let recoveryStats = { concept: 0, calculation: 0, keyword: 0 }

  const { data: latestSheet } = await supabase
    .from("answer_sheets")
    .select("id")
    .eq("student_id", student.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (latestSheet) {
      const { data: feedback } = await supabase
        .from("feedback_analysis")
        .select("root_cause_analysis")
        .eq("answer_sheet_id", latestSheet.id)
        .single()

      if (feedback && feedback.root_cause_analysis) {
          const r = feedback.root_cause_analysis as any
          recoveryStats = {
              concept: Number(r.concept || 0),
              calculation: Number(r.calculation || 0),
              keyword: Number(r.keyword || 0)
          }
      }
  }

  // 3. Why it Matters (From latest feedback, regardless of approved status for "context",
  // but better to stick to approved or at least recent.)
  let whyItem = null
  if (latestSheet) {
      const { data: feedback } = await supabase
        .from("feedback_analysis")
        .select("real_world_application, focus_areas")
        .eq("answer_sheet_id", latestSheet.id)
        .single()

      if (feedback && feedback.real_world_application) {
          whyItem = {
              desc: feedback.real_world_application,
              topic: feedback.focus_areas?.[0] || "General"
          }
      }
  }


  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
                {student.name.split(' ')[0]}'s Mission Control
            </h1>
            <p className="text-muted-foreground mt-1">
                Optimized for {student.challenge_mode ? "Mastery & Challenge" : "Efficiency & Growth"}.
            </p>
        </div>
        <ChallengeModeToggle initialState={student.challenge_mode} studentId={student.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1 & 2: Main Action Center */}
        <div className="lg:col-span-2 space-y-6">

            {/* NEXT BEST ACTION HERO */}
            <GlassCard className="p-0 overflow-hidden border-neon-cyan/30 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-neon-purple" />
                <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                            <span className="text-xs font-mono text-neon-cyan uppercase tracking-wider flex items-center gap-2">
                                <Target size={14} /> Next Best Action
                            </span>
                            <h2 className="text-2xl font-bold font-display text-foreground">
                                {nbaTask ? nbaTask.title : "No high-priority missions detected."}
                            </h2>
                        </div>
                        {nbaTask && (
                             <span className={cn(
                                "text-xs font-bold px-3 py-1 rounded-full border",
                                (nbaTask.metadata?.effort_score || 0) <= 3 ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                (nbaTask.metadata?.effort_score || 0) >= 8 ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                            )}>
                                {nbaTask.metadata?.effort_score ? `Effort: ${nbaTask.metadata.effort_score}/10` : "High Priority"}
                            </span>
                        )}
                    </div>

                    <p className="text-muted-foreground mb-6 max-w-xl">
                        {nbaTask?.why || "Your dashboard is clear. Review your recent exams or upload new study materials to generate tasks."}
                    </p>

                    {nbaTask ? (
                         <div className="flex gap-4">
                            <ButtonAction href="/student/planner" label="Start Mission" icon={<Play size={16} />} primary />
                            <ButtonAction href="/student/performance" label="Why this task?" icon={<Brain size={16} />} />
                         </div>
                    ) : (
                        <ButtonAction href="/student/study" label="Upload Materials" icon={<ArrowUpRight size={16} />} primary />
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
                        82 <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <Zap size={16} /> Focus Hours
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        12.5 <span className="text-sm font-normal text-muted-foreground">hrs</span>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <TrendingUp size={16} /> Efficiency
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        +14 <span className="text-sm font-normal text-muted-foreground">%</span>
                    </div>
                </GlassCard>
            </div>
        </div>

        {/* COL 3: Context & Recovery */}
        <div className="lg:col-span-1 grid grid-cols-1 gap-6 h-full content-start">

            {/* Mark Recovery Widget */}
            <div className="min-h-[200px]">
                <MarkRecoveryWidget stats={recoveryStats} />
            </div>

            {/* Why it Matters Widget */}
            <GlassCard className="p-6 flex flex-col relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-32 bg-neon-purple/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Brain className="text-neon-purple" size={20} />
                    Why it Matters
                </h3>

                <div className="flex-1 space-y-6">
                    {whyItem ? (
                        <div className="relative z-10">
                            <span className="text-xs font-mono text-neon-purple mb-2 block uppercase tracking-wider">
                                {whyItem.topic}
                            </span>
                            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                {whyItem.desc}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p className="text-sm">Context will appear here after your first analyzed exam.</p>
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

function ButtonAction({ href, label, icon, primary }: { href: string, label: string, icon: any, primary?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                primary
                    ? "bg-neon-cyan text-black hover:bg-neon-cyan/80"
                    : "bg-white/5 hover:bg-white/10 text-foreground border border-white/10"
            )}
        >
            {icon}
            {label}
        </Link>
    )
}
