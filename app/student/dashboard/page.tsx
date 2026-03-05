import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import {
    Target, Brain, TrendingUp, ArrowRight, Play, Flame, AlertCircle,
    Sparkles, Folder, Calendar, BookOpen, Star, Trophy
} from "lucide-react"
import Link from "next/link"
import { MarkRecoveryWidget } from "@/components/dashboard/mark-recovery-widget"
import { StreakReminder } from "@/components/student/streak-reminder"
import { StudentTasksWidget } from "@/components/student/tasks-widget"
import { StudyThisButton } from "@/components/student/study-this-button"
import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief"
import { ActiveSessionsWidget } from "@/components/dashboard/active-sessions-widget"
import { SelfAssessmentPrompt } from "@/components/student/self-assessment-prompt"
import { ProgressBar } from "@/components/dashboard/progress-bar"
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
                <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 shadow-sm">
                    <AlertCircle size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-bold">Account Link Required</h1>
                    <p className="text-muted-foreground max-w-sm text-lg mx-auto">
                        We couldn&apos;t find your student profile. Ask your teacher to add you!
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button asChild variant="default" className="px-6 py-3">
                        <Link href="/auth/sign-up">
                            Try Linking Again <ArrowRight size={18} />
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    const currentXp = student.xp || 0
    const levelProgress = Math.min(100, Math.max(0, currentXp % 100))

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
            exams (exam_name, total_marks, subject, exam_date),
            feedback_analysis (exam_name, exam_subject, exam_total_marks)
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

    // Recent AI Guide sessions for the "Resume Studying" widget
    const { data: recentSessions } = await supabase
        .from("ai_guide_sessions")
        .select("id, title, last_active_at")
        .eq("student_id", student.id)
        .order("last_active_at", { ascending: false })
        .limit(5)

    // 4. Upcoming Exams
    const { data: upcomingExams } = await supabase
        .from("exams")
        .select("id, exam_name, exam_date, subject")
        .eq("class", student.class)
        .gte("exam_date", new Date().toISOString().split('T')[0])
        .order("exam_date", { ascending: true })
        .limit(3)

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Header with Performance Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                        <span className="font-display font-bold text-2xl">{student.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                            Hello, {student.name.split(' ')[0]}!
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">Ready to learn?</p>
                    </div>
                </div>

                {/* Performance Pill */}
                <GlassCard className="px-6 py-4 flex items-center gap-6 rounded-2xl" variant="neu">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Avg. Score</p>
                            <p className="text-2xl font-display font-bold text-foreground">{averageScore}%</p>
                        </div>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-chart-4/10 text-chart-4">
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Streak</p>
                            <p className="text-2xl font-display font-bold text-foreground">{student.streak || 0} <span className="text-sm font-medium text-muted-foreground">days</span></p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <AiDailyBrief studentId={student.id} />

            <GlassCard className="p-5">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Level Progress</p>
                    <span className="text-sm font-semibold text-foreground">Level {student.level || 1}</span>
                </div>
                <ProgressBar label="XP to next level" value={levelProgress} />
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Content (Left 8 cols) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Hero Action Card */}
                    <GlassCard variant="liquid" className="p-8 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-xs font-bold text-primary uppercase tracking-wider border border-primary/10">
                                        Recommended Focus
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-3 max-w-xl leading-tight">
                                    {nbaTask ? nbaTask.title : "Explore the Knowledge Vault"}
                                </h2>
                                <p className="text-muted-foreground mb-6 max-w-lg text-sm">
                                    {nbaTask?.why || "You're all caught up! Browse past materials or practice with AI flashcards."}
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    <Button asChild variant="default" className="px-8 py-6 text-base shadow-lg shadow-primary/25">
                                        <Link href={nbaTask ? "/student/vault?tab=missions" : "/student/vault"}>
                                            {nbaTask ? <Play size={20} fill="currentColor" /> : <Folder size={20} />}
                                            {nbaTask ? "Start Mission" : "Open Vault"}
                                        </Link>
                                    </Button>
                                    <Button asChild variant="secondary" className="px-8 py-6 text-base">
                                        <Link href="/student/performance">
                                            <TrendingUp size={20} /> View Analytics
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden md:flex shrink-0">
                                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 group-hover:bg-primary/20 transition-all duration-500">
                                    {nbaTask ? <Target size={48} className="text-primary" /> : <BookOpen size={48} className="text-primary" />}
                                </div>
                            </div>
                        </div>

                        {/* Abstract Background Shapes */}
                        <div className="absolute -right-20 -bottom-40 w-80 h-80 bg-chart-1/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -left-20 -top-40 w-80 h-80 bg-chart-5/20 rounded-full blur-3xl pointer-events-none" />
                    </GlassCard>

                    {/* Recent Results Cards */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Star className="text-amber-500 fill-amber-500" size={20} />
                                Recent Results
                            </h3>
                            <Link href="/student/performance" className="text-sm font-medium text-primary hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentExams && recentExams.length > 0 ? recentExams.slice(0, 4).map((sheet: any) => {
                                const examData = sheet.exams
                                const feedbackData = sheet.feedback_analysis?.[0]
                                const displayName = feedbackData?.exam_name || examData?.exam_name || 'Exam'
                                const displaySubject = feedbackData?.exam_subject || examData?.subject || 'General'
                                const totalMarks = feedbackData?.exam_total_marks || examData?.total_marks || 100
                                const percentage = Math.round((sheet.total_score / totalMarks) * 100)
                                return (
                                    <Link key={sheet.id} href={`/student/performance/${sheet.id}`}>
                                        <GlassCard hoverEffect className="p-5 flex flex-col justify-between h-full group border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                        {displaySubject}
                                                    </p>
                                                    <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                        {displayName}
                                                    </h4>
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold border",
                                                    percentage >= 80 ? "bg-chart-3/10 text-chart-3 border-chart-3/20" :
                                                        percentage >= 60 ? "bg-chart-4/10 text-chart-4 border-chart-4/20" :
                                                            "bg-destructive/10 text-destructive border-destructive/20"
                                                )}>
                                                    {percentage}%
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                <span>{new Date(sheet.created_at).toLocaleDateString()}</span>
                                                <div className="flex items-center gap-2">
                                                    <StudyThisButton examId={sheet.id} examName={displayName} studentId={student.id} />
                                                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-primary font-medium">
                                                        Feedback <ArrowRight size={12} aria-label={`View feedback for ${displayName}`} />
                                                    </span>
                                                </div>
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

                {/* Right Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Upcoming Schedule */}
                    <GlassCard variant="neu" className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="text-primary" size={20} />
                            Upcoming Exams
                        </h3>
                        <div className="space-y-4">
                            {upcomingExams && upcomingExams.length > 0 ? upcomingExams.map((exam: any) => (
                                <div key={exam.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border transition-colors hover:border-border/80">
                                    <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20 shrink-0">
                                        <span className="text-[10px] tracking-widest uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl leading-none">{new Date(exam.exam_date).getDate()}</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-foreground text-sm truncate">{exam.exam_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{exam.subject}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams scheduled.</p>
                            )}
                        </div>
                    </GlassCard>

                    {(() => {
                        if (!upcomingExams || upcomingExams.length === 0) return null
                        const soon = upcomingExams[0] as any
                        const daysUntil = Math.ceil(
                            (new Date(soon.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        )
                        if (daysUntil > 7) return null
                        return (
                            <SelfAssessmentPrompt
                                examId={soon.id}
                                examName={soon.exam_name}
                                studentId={student.id}
                                subject={soon.subject || "General"}
                            />
                        )
                    })()}

                    {/* Widgets */}
                    <ActiveSessionsWidget sessions={recentSessions || []} />
                    <MarkRecoveryWidget stats={recoveryStats} studentId={student.id} />

                    {/* Quick Access */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Study</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Button asChild variant="secondary" className="h-[80px] flex-col rounded-xl hover:bg-secondary/80">
                                <Link href="/student/flashcards" className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <Brain size={24} className="text-chart-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-semibold">Flashcards</span>
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" className="h-[80px] flex-col rounded-xl hover:bg-secondary/80">
                                <Link href="/student/vault" className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <BookOpen size={24} className="text-chart-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-semibold">Library</span>
                                </Link>
                            </Button>
                            <Button asChild variant="default" className="h-[60px] col-span-2 rounded-xl text-base shadow-lg shadow-primary/20">
                                <Link href="/student/ai-guide" className="w-full h-full flex items-center justify-center gap-3">
                                    <Sparkles size={20} className="group-hover:spin-slow" />
                                    <span className="font-bold">Open AI Study Guide</span>
                                </Link>
                            </Button>
                        </div>
                    </GlassCard>

                </div>
            </div>
        </div>
    )
}





