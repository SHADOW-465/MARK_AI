import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import {
    Target, Brain, TrendingUp, ArrowRight, Play, Flame, AlertCircle,
    Sparkles, Folder, Calendar, BookOpen, Star, Trophy, Clock
} from "lucide-react"
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
                <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <AlertCircle size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-bold">Account Link Required</h1>
                    <p className="text-muted-foreground max-w-sm text-lg">
                        We couldn&apos;t find your student profile. Ask your teacher to add you!
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/auth/sign-up" className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:scale-105 transition-transform flex items-center gap-2">
                        Try Linking Again <ArrowRight size={18} />
                    </Link>
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

    // 2. Recent Graded Exams & Average Calculation
    const { data: recentExams } = await supabase
        .from("answer_sheets")
        .select(`
        id, created_at, total_score, status, exam_id,
        exams!left (exam_name, total_marks, subject, exam_date)
    `)
        .eq("student_id", student.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5)

    // Calculate Average Score
    let averageScore = 0
    if (recentExams && recentExams.length > 0) {
        const total = recentExams.reduce((acc, exam) => {
            const examData = exam.exams as any
            const max = examData?.total_marks || 100
            return acc + ((exam.total_score || 0) / max) * 100
        }, 0)
        averageScore = Math.round(total / recentExams.length)
    }

    // 3. Mark Recovery Stats
    let recoveryStats = { concept: 0, calculation: 0, keyword: 0 }
    if (recentExams && recentExams.length > 0) {
        const { data: feedback } = await supabase
            .from("feedback_analysis")
            .select("root_cause_analysis")
            .eq("answer_sheet_id", recentExams[0].id)
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

    // 4. Upcoming Exams
    const { data: upcomingExams } = await supabase
        .from("exams")
        .select("id, exam_name, exam_date, subject")
        .eq("class", student.class)
        .gte("exam_date", new Date().toISOString().split('T')[0])
        .order("exam_date", { ascending: true })
        .limit(3)

    return (
        <div className="space-y-8 pb-24 animate-fade-in-up">

            {/* Header with Performance Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <span className="font-display font-bold text-lg">{student.name.charAt(0)}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                                Hello, {student.name.split(' ')[0]}!
                            </h1>
                            <p className="text-muted-foreground font-medium">Ready to learn?</p>
                        </div>
                    </div>
                </div>

                {/* Performance Pill */}
                <GlassCard className="px-6 py-4 flex items-center gap-6 rounded-2xl border border-border" variant="neu">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Avg. Score</p>
                            <p className="text-2xl font-display font-bold text-foreground">{averageScore}%</p>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Streak</p>
                            <p className="text-2xl font-display font-bold text-foreground">{student.streak || 0} <span className="text-sm font-medium text-muted-foreground">days</span></p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Hero Action Card */}
                    <GlassCard variant="liquid" gradientColor="purple" className="p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                                            Recommended Focus
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-display font-bold text-white mb-2 max-w-lg leading-tight">
                                        {nbaTask ? nbaTask.title : "Explore the Knowledge Vault"}
                                    </h2>
                                    <p className="text-indigo-100 mb-6 max-w-md">
                                        {nbaTask?.why || "You're all caught up! Browse past materials or practice with AI flashcards."}
                                    </p>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="h-24 w-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-500">
                                        {nbaTask ? <Target size={40} className="text-white" /> : <BookOpen size={40} className="text-white" />}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Link
                                    href={nbaTask ? "/student/vault?tab=missions" : "/student/vault"}
                                    className="px-6 py-3 rounded-full bg-white text-indigo-600 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    {nbaTask ? <Play size={18} fill="currentColor" /> : <Folder size={18} />}
                                    {nbaTask ? "Start Mission" : "Open Vault"}
                                </Link>
                                <Link
                                    href="/student/performance"
                                    className="px-6 py-3 rounded-full bg-indigo-800/30 text-white font-semibold border border-white/10 hover:bg-indigo-800/50 transition-all flex items-center gap-2 backdrop-blur-md"
                                >
                                    <TrendingUp size={18} /> View Analytics
                                </Link>
                            </div>
                        </div>

                        {/* Abstract Background Shapes */}
                        <div className="absolute -right-20 -bottom-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-colors duration-1000" />
                        <div className="absolute -left-20 -top-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl group-hover:bg-indigo-400/30 transition-colors duration-1000" />
                    </GlassCard>

                    {/* Recent Results Cards */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                                <Star className="text-amber-500 fill-amber-500" size={20} />
                                Recent Results
                            </h3>
                            <Link href="/student/performance" className="text-sm font-medium text-primary hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentExams && recentExams.length > 0 ? recentExams.slice(0, 4).map((sheet: any) => {
                                const examData = sheet.exams
                                const percentage = Math.round((sheet.total_score / (examData?.total_marks || 100)) * 100)
                                return (
                                    <Link key={sheet.id} href={`/student/performance/${sheet.id}`}>
                                        <GlassCard hoverEffect className="p-5 flex flex-col justify-between h-full group border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                        {examData?.subject}
                                                    </p>
                                                    <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                        {examData?.exam_name}
                                                    </h4>
                                                </div>
                                                <div className={cn(
                                                    "px-2 py-1 rounded-lg text-xs font-bold",
                                                    percentage >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                        percentage >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                )}>
                                                    {percentage}%
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                <span>{new Date(sheet.created_at).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-primary font-medium">
                                                    Feedback <ArrowRight size={12} />
                                                </span>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                )
                            }) : (
                                <div className="col-span-2 text-center py-12 text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
                                    <p>No graded exams yet. Time to study!</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar (1 col) */}
                <div className="space-y-8">

                    {/* Upcoming Schedule */}
                    <GlassCard variant="neu" className="p-6">
                        <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="text-indigo-500" size={20} />
                            Upcoming Exams
                        </h3>
                        <div className="space-y-4">
                            {upcomingExams && upcomingExams.length > 0 ? upcomingExams.map((exam: any) => (
                                <div key={exam.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 border border-border shadow-sm">
                                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30">
                                        <span className="text-xs uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg leading-none">{new Date(exam.exam_date).getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm line-clamp-1">{exam.exam_name}</p>
                                        <p className="text-xs text-muted-foreground">{exam.subject}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams scheduled.</p>
                            )}
                        </div>
                    </GlassCard>

                    {/* Widgets */}
                    <MarkRecoveryWidget stats={recoveryStats} />

                    {/* Quick Access */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-display font-bold text-foreground mb-4">Quick Study</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/student/flashcards" className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors flex flex-col items-center justify-center gap-2 text-center cursor-pointer group">
                                <Brain size={24} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">Flashcards</span>
                            </Link>
                            <Link href="/student/vault" className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors flex flex-col items-center justify-center gap-2 text-center cursor-pointer group">
                                <BookOpen size={24} className="text-teal-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-semibold">Library</span>
                            </Link>
                        </div>
                    </GlassCard>

                </div>
            </div>
        </div>
    )
}
