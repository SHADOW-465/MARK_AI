import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { ArrowUpRight, Target, Brain, TrendingUp, Zap, ArrowRight, Play, Flame, AlertCircle, FileText, Sparkles, Folder } from "lucide-react"
import Link from "next/link"
import { ChallengeModeToggle } from "@/components/dashboard/challenge-mode-toggle"
import { MarkRecoveryWidget } from "@/components/dashboard/mark-recovery-widget"
import { StreakReminder } from "@/components/student/streak-reminder"
import { StudentTasksWidget } from "@/components/student/tasks-widget"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in</div>
    }

    // Fetch Student Data
    const { data: student } = await supabase
        .from("students")
        .select("id, name, class, challenge_mode, xp, streak, level, last_active_at")
        .eq("user_id", user.id)
        .maybeSingle()

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold font-display">Account Link Required</h1>
                    <p className="text-muted-foreground max-w-sm">
                        We couldn&apos;t find a student record linked to your account. This happens if your teacher hasn&apos;t added you yet or if the roll number didn&apos;t match.
                    </p>
                </div>
                <div className="flex gap-4">
                    <ButtonAction href="/auth/sign-up" label="Try Linking Again" icon={<ArrowRight size={16} />} primary />
                    <ButtonAction href="/" label="Back Home" icon={<Target size={16} />} />
                </div>
            </div>
        )
    }

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


    // 4. Recent Graded Exams for Progress Tracking
    // Use exams!inner or exams to control join behavior
    const { data: recentExams, error: recentExamsError } = await supabase
        .from("answer_sheets")
        .select(`
        id,
        total_score,
        status,
        exam_id,
        exams!left (exam_name, total_marks, subject)
    `)
        .eq("student_id", student.id)
        .eq("status", "approved")
        .limit(3)

    // 5. Improvement Path: Finding Specific Gaps (Questions where score < 70% of max)
    let gaps: any[] = []
    if (latestSheet) {
        const { data: evals } = await supabase
            .from("question_evaluations")
            .select(`
            id,
            question_num,
            final_score,
            reasoning,
            exams:answer_sheets (
                exams (marking_scheme)
            )
        `)
            .eq("answer_sheet_id", latestSheet.id)

        if (evals) {
            evals.forEach((ev: any) => {
                const sheetData = ev.exams as any
                const scheme = sheetData?.exams?.marking_scheme || []
                const qDetails = scheme.find((q: any) => q.question_num === ev.question_num)
                const maxMarks = qDetails?.max_marks || 0

                if (maxMarks > 0 && (ev.final_score / maxMarks) < 0.7) {
                    gaps.push({
                        num: ev.question_num,
                        text: qDetails?.question_text,
                        lost: maxMarks - ev.final_score,
                        feedback: ev.reasoning
                    })
                }
            })
        }
    }

    // 6. Fetch all pending tasks for the widget
    const { data: allTasks } = await supabase
        .from("student_tasks")
        .select("*")
        .eq("student_id", student.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-10 pb-20 mt-4 outline-none">
            {/* Streak Reminder (Client Component) */}
            <StreakReminder streak={student.streak || 0} lastActiveAt={student.last_active_at} />

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold tracking-tight text-foreground bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                        {student.name.split(' ')[0]}&apos;s Mission Control
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">
                        System Status: Optimized for {student.challenge_mode ? "Maximum Mastery" : "Peak Efficiency"}.
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* XP & Streak Display */}
                    <div className="flex items-center gap-4 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
                        <div className="flex items-center gap-2.5" title="Mastery Streak">
                            <Flame size={22} className={cn(
                                "transition-all duration-500",
                                (student.streak || 0) > 0 ? "text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse" : "text-muted-foreground opacity-50"
                            )} />
                            <span className="text-xl font-bold font-display leading-none">{student.streak || 0}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-1" />
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
                                <span>LVL {student.level || 1}</span>
                                <span>{(student.xp || 0) % 1000}/1000 XP</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-1000 shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                                    style={{ width: `${((student.xp || 0) % 1000) / 10}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <ChallengeModeToggle initialState={student.challenge_mode} studentId={student.id} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* MAIN FEED (Left 3 cols) */}
                <div className="lg:col-span-3 space-y-10">

                    {/* NEXT BEST ACTION HERO */}
                    <GlassCard className="p-0 overflow-hidden border-neon-cyan/30 relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-neon-purple" />
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-mono text-neon-cyan uppercase tracking-wider flex items-center gap-2">
                                        <Target size={14} /> Next Best Action
                                    </span>
                                    <h2 className="text-2xl font-bold font-display text-foreground group-hover:text-neon-cyan transition-colors">
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

                            <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                                {nbaTask?.why || "Your dashboard is clear. Review your recent exams or upload new study materials to generate tasks."}
                            </p>

                            {nbaTask ? (
                                <div className="flex gap-4">
                                    <ButtonAction href="/student/planner" label="Resolve Now" icon={<Play size={16} />} primary />
                                    <ButtonAction href={`/student/study?examId=${latestSheet?.id}`} label="Deep Dive Source" icon={<Brain size={16} />} />
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <ButtonAction href="/student/study" label="Upload Materials" icon={<ArrowUpRight size={16} />} primary />
                                    <ButtonAction href="/student/performance" label="View History" icon={<TrendingUp size={16} />} />
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* RECENT FEEDBACK (Graded Exams) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp size={18} className="text-neon-cyan" />
                                Recent Results
                            </h3>
                            <Link href="/student/performance" className="text-xs text-muted-foreground hover:text-foreground">View all results &rarr;</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentExams && recentExams.length > 0 ? recentExams.map((exam: any) => (
                                <Link key={exam.id} href={`/student/performance/${exam.id}`}>
                                    <GlassCard className="p-4 hover:border-neon-cyan/50 transition-all group overflow-hidden h-full">
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-neon-cyan transition-colors">
                                            {exam.exams?.subject || 'Unknown Subject'}
                                        </div>
                                        <h4 className="font-bold text-sm truncate mb-3 group-hover:text-foreground">
                                            {exam.exams?.exam_name || 'Exam (Deleted)'}
                                        </h4>
                                        <div className="flex items-end justify-between">
                                            <div className="text-2xl font-bold font-display">
                                                {exam.total_score} <span className="text-[10px] text-muted-foreground font-sans font-normal">/ {exam.exams?.total_marks || '?'}</span>
                                            </div>
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    </GlassCard>
                                </Link>
                            )) : (
                                <div className="md:col-span-3 p-8 border-dashed border border-white/5 rounded-xl text-center text-muted-foreground text-sm">
                                    No graded papers yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* IMPROVEMENT PATH (Specific Question Gaps) */}
                    {gaps.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Urgent Gaps to Fix
                            </h3>
                            <div className="space-y-3">
                                {gaps.slice(0, 3).map((gap, i) => (
                                    <GlassCard key={i} className="p-4 border-l-2 border-amber-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold border border-amber-500/20">
                                                Q{gap.num}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-foreground leading-relaxed italic mb-1">
                                                    &quot;{gap.text?.substring(0, 100)}...&quot;
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Feedback: {gap.feedback?.substring(0, 80)}...
                                                </p>
                                            </div>
                                        </div>
                                        <ButtonAction
                                            href={`/student/flashcards`}
                                            label="Recall Fix"
                                            icon={<Brain size={12} />}
                                            className="text-[10px] h-8 px-4 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                        />
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR (Right 1 col) */}
                <div className="space-y-6">
                    <StudentTasksWidget initialTasks={allTasks || []} />

                    <MarkRecoveryWidget stats={recoveryStats} />

                    <GlassCard className="p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-neon-purple/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="text-neon-purple" size={18} />
                            Why it Matters
                        </h3>
                        {whyItem ? (
                            <div className="space-y-4">
                                <span className="text-[10px] font-mono p-1 bg-neon-purple/10 text-neon-purple border border-neon-purple/20 rounded uppercase tracking-wider">
                                    {whyItem.topic}
                                </span>
                                <p className="text-xs text-foreground/80 leading-relaxed italic">
                                    {whyItem.desc}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Analyze an exam to see real-world impact.</p>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Student OS Hubs</h4>
                            <Link href="/student/vault" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                                <div className="h-8 w-8 rounded flex items-center justify-center bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                                    <Folder size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">The Vault</p>
                                    <p className="text-[10px] text-muted-foreground">Tasks & Knowledge</p>
                                </div>
                            </Link>
                            <Link href="/student/flashcards" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                                <div className="h-8 w-8 rounded flex items-center justify-center bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                    <Brain size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">Flashcards</p>
                                    <p className="text-[10px] text-muted-foreground">Active Recall</p>
                                </div>
                            </Link>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}

function ButtonAction({ href, label, icon, primary, className }: { href: string, label: string, icon: any, primary?: boolean, className?: string }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                primary
                    ? "bg-neon-cyan text-black hover:bg-neon-cyan/90 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-white/5 hover:bg-white/10 text-foreground border border-white/10",
                className
            )}
        >
            {icon}
            {label}
        </Link>
    )
}

