import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Target, Brain, TrendingUp, ArrowRight, Play, Flame, AlertCircle, Sparkles, Folder } from "lucide-react"
import Link from "next/link"
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
                <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">Account Link Required</h1>
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

    // 1. NBA Hero: Query Tasks sorted by impact
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

    // 2. Mark Recovery Stats
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
            const r = feedback.root_cause_analysis as Record<string, unknown>
            recoveryStats = {
                concept: Number(r.concept || 0),
                calculation: Number(r.calculation || 0),
                keyword: Number(r.keyword || 0)
            }
        }
    }

    // 3. Why it Matters
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

    // 4. Recent Graded Exams
    const { data: recentExams } = await supabase
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

    // 5. Improvement Path: Finding Specific Gaps
    const gaps: Array<{ num: number; text: string; lost: number; feedback: string }> = []
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
            evals.forEach((ev: Record<string, unknown>) => {
                const sheetData = ev.exams as Record<string, unknown> | null
                const examData = sheetData?.exams as Record<string, unknown> | null
                const scheme = (examData?.marking_scheme || []) as Array<{ question_num: number; max_marks: number; question_text: string }>
                const qDetails = scheme.find((q) => q.question_num === ev.question_num)
                const maxMarks = qDetails?.max_marks || 0

                if (maxMarks > 0 && ((ev.final_score as number) / maxMarks) < 0.7) {
                    gaps.push({
                        num: ev.question_num as number,
                        text: qDetails?.question_text || '',
                        lost: maxMarks - (ev.final_score as number),
                        feedback: ev.reasoning as string
                    })
                }
            })
        }
    }

    // 6. Fetch all pending tasks
    const { data: allTasks } = await supabase
        .from("student_tasks")
        .select("*")
        .eq("student_id", student.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-8 pb-20">
            {/* Streak Reminder */}
            <StreakReminder streak={student.streak || 0} lastActiveAt={student.last_active_at} />

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Hey {student.name.split(' ')[0]},
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        How can I help you with your learning today?
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* XP & Streak Display */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-card border border-border rounded-xl shadow-sm">
                        <div className="flex items-center gap-2" title="Learning Streak">
                            <Flame size={20} className={cn(
                                "transition-all duration-300",
                                (student.streak || 0) > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground opacity-50"
                            )} />
                            <span className="text-lg font-semibold">{student.streak || 0}</span>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div className="flex flex-col gap-1 min-w-[120px]">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Level {student.level || 1}</span>
                                <span>{(student.xp || 0) % 1000}/1000 XP</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${((student.xp || 0) % 1000) / 10}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* MAIN FEED (Left 3 cols) */}
                <div className="lg:col-span-3 space-y-6">

                    {/* AI GUIDANCE HERO */}
                    <GlassCard className="p-0 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-primary font-medium flex items-center gap-2">
                                        <Sparkles size={14} /> AI Recommendation
                                    </span>
                                    <h2 className="text-xl font-semibold text-foreground mt-2">
                                        {nbaTask ? `Your next milestone: ${nbaTask.title}` : "Your dashboard is clear. What's next?"}
                                    </h2>
                                </div>
                                {nbaTask && (
                                    <span className={cn(
                                        "text-xs font-medium px-3 py-1 rounded-full border",
                                        (nbaTask.metadata?.effort_score || 0) <= 3 ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                                            (nbaTask.metadata?.effort_score || 0) >= 8 ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" :
                                                "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                                    )}>
                                        {nbaTask.metadata?.effort_score ? `Approx. ${nbaTask.metadata.effort_score * 10} min` : "Top Priority"}
                                    </span>
                                )}
                            </div>

                            <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                                {nbaTask?.why || "You've handled your active missions! Take a moment to review your progress or dive into the library to explore new topics."}
                            </p>

                            {nbaTask ? (
                                <div className="flex gap-3">
                                    <ButtonAction href="/student/vault?tab=missions" label="Start Mission" icon={<Play size={16} />} primary />
                                    <ButtonAction href={`/student/vault?tab=ai_studio&examId=${latestSheet?.id}`} label="AI Deep Dive" icon={<Brain size={16} />} />
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <ButtonAction href="/student/vault" label="Go to Library" icon={<Folder size={16} />} primary />
                                    <ButtonAction href="/student/performance" label="Insights" icon={<TrendingUp size={16} />} />
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* RECENT FEEDBACK */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <TrendingUp size={18} className="text-primary" />
                                Latest Insights
                            </h3>
                            <Link href="/student/performance" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all progress &rarr;</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentExams && recentExams.length > 0 ? recentExams.map((exam: Record<string, unknown>) => {
                                const examData = exam.exams as Record<string, unknown> | null
                                return (
                                    <Link key={exam.id as string} href={`/student/performance/${exam.id}`}>
                                        <GlassCard className="p-4 hover:border-primary/30 transition-all group h-full">
                                            <div className="text-xs text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                                                {(examData?.subject as string) || 'General'}
                                            </div>
                                            <h4 className="font-medium text-sm truncate mb-3">
                                                {(examData?.exam_name as string) || 'Evaluation'}
                                            </h4>
                                            <div className="flex items-end justify-between">
                                                <div className="text-2xl font-semibold">
                                                    {exam.total_score as number} <span className="text-xs text-muted-foreground font-normal">/ {(examData?.total_marks as number) || '?'}</span>
                                                </div>
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                            </div>
                                        </GlassCard>
                                    </Link>
                                )
                            }) : (
                                <div className="md:col-span-3 p-8 border-dashed border border-border rounded-xl text-center text-muted-foreground text-sm">
                                    No graded results yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* URGENT GAPS */}
                    {gaps.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Knowledge Gaps
                            </h3>
                            <div className="space-y-3">
                                {gaps.slice(0, 3).map((gap, i) => (
                                    <GlassCard key={i} className="p-4 border-l-2 border-amber-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                                                Q{gap.num}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-1">
                                                    &quot;{gap.text?.substring(0, 100)}...&quot;
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    AI Tip: {gap.feedback}
                                                </p>
                                            </div>
                                        </div>
                                        <ButtonAction
                                            href={`/student/flashcards`}
                                            label="Practice Recall"
                                            icon={<Brain size={12} />}
                                            className="text-xs h-8 px-4 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
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

                    <GlassCard className="p-5 flex flex-col relative overflow-hidden">
                        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="text-primary" size={18} />
                            AI Insight
                        </h3>
                        {whyItem ? (
                            <div className="space-y-3">
                                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded">
                                    {whyItem.topic}
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    &quot;{whyItem.desc}&quot;
                                </p>
                                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                    This concept is vital for real-world applications in this field.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Analyze an exam to reveal specialized learning insights.</p>
                        )}

                        <div className="mt-6 pt-4 border-t border-border">
                            <div className="p-4 rounded-lg bg-muted">
                                <p className="text-xs font-medium text-primary mb-1">Pro Tip</p>
                                <p className="text-sm text-muted-foreground leading-snug">
                                    Consistency beats intensity. Even 15 minutes of <b>Active Recall</b> daily will yield 2x better retention.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}

function ButtonAction({ href, label, icon, primary, className }: { href: string, label: string, icon: React.ReactNode, primary?: boolean, className?: string }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                primary
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border",
                className
            )}
        >
            {icon}
            {label}
        </Link>
    )
}
