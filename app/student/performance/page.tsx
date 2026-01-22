import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, Clock, ArrowRight, TrendingUp, BarChart2 } from "lucide-react"
import Link from "next/link"
import { PredictiveGradeSandbox } from "@/components/performance/predictive-grade-sandbox"
import { AnalyticsCharts } from "@/components/student/analytics-charts"

export const dynamic = 'force-dynamic'

export default async function ProgressInsights() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Student
    const { data: student } = await supabase
        .from("students")
        .select("id, xp, streak, level")
        .eq("user_id", user?.id)
        .single()

    if (!student) {
        return <div className="text-center py-20 text-muted-foreground">Student record not found.</div>
    }

    // 1. Fetch XP logs for chart
    const { data: xpLogs } = await supabase
        .from("xp_logs")
        .select("amount, activity_type, created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: true })
        .limit(50)

    // 2. Fetch Answer Sheets with Exam details and Feedback Analysis
    const { data: sheets } = await supabase
        .from("answer_sheets")
        .select(`
            id,
            total_score,
            status,
            exam_id,
            created_at,
            exams (
                id,
                exam_name,
                total_marks,
                subject,
                marking_scheme
            ),
            feedback_analysis (
                exam_name,
                exam_subject,
                exam_total_marks
            )
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })

    // Filter out sheets without exam data and prepare lists
    const exams = (sheets || []).filter((s: any) => s.exams !== null)
    const approvedExams = exams.filter((e: any) => e.status === 'approved')

    // 3. Fetch Feedback Analysis for Gap Stats
    const { data: feedbackList } = await supabase
        .from("feedback_analysis")
        .select("root_cause_analysis, answer_sheet_id")
        .eq("student_id", student.id)

    // Aggregate Analytics Data
    const xpChartData = xpLogs?.reduce((acc: any[], log) => {
        const date = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = acc.find(d => d.date === date)
        if (existing) {
            existing.xp += log.amount
        } else {
            acc.push({ date, xp: log.amount })
        }
        return acc
    }, []) || []

    let cumulativeXP = 0
    const cumulativeXpData = xpChartData.map(d => {
        cumulativeXP += d.xp
        return { ...d, totalXp: cumulativeXP }
    })

    const examScoreData = approvedExams.map((sheet: any) => {
        const examData = sheet.exams as any
        return {
            name: examData?.exam_name || 'Exam',
            score: sheet.total_score,
            total: examData?.total_marks || 100,
            percentage: Math.round((sheet.total_score / (examData?.total_marks || 100)) * 100),
            subject: examData?.subject || 'General'
        }
    }).reverse()

    const subjectPerformance: Record<string, { scores: number[], total: number }> = {}
    approvedExams.forEach((sheet: any) => {
        const examData = sheet.exams as any
        const subject = examData?.subject || 'General'
        const percentage = (sheet.total_score / (examData?.total_marks || 100)) * 100
        if (!subjectPerformance[subject]) {
            subjectPerformance[subject] = { scores: [], total: 0 }
        }
        subjectPerformance[subject].scores.push(percentage)
        subjectPerformance[subject].total++
    })

    const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => ({
        subject,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        examsCount: data.total
    }))

    // Gap Stats Calculation
    let gapStats = { concept: 0, calculation: 0, keyword: 0, total: 0 }
    if (feedbackList) {
        feedbackList.forEach((f: any) => {
            const root = f.root_cause_analysis
            if (root) {
                gapStats.concept += Number(root.concept || 0)
                gapStats.calculation += Number(root.calculation || 0)
                gapStats.keyword += Number(root.keyword || 0)
            }
        })
        gapStats.total = gapStats.concept + gapStats.calculation + gapStats.keyword
    }

    let lastExamStats = {
        concept: 0, calculation: 0, keyword: 0,
        currentGrade: 0, maxScore: 0
    }
    const latestApproved = approvedExams[0]
    if (latestApproved) {
        const examData = latestApproved.exams as any
        const feedback = feedbackList?.find((f: any) => f.answer_sheet_id === latestApproved.id)
        if (feedback && feedback.root_cause_analysis) {
            const r = feedback.root_cause_analysis
            lastExamStats = {
                concept: Number(r.concept || 0),
                calculation: Number(r.calculation || 0),
                keyword: Number(r.keyword || 0),
                currentGrade: latestApproved.total_score,
                maxScore: examData?.total_marks || 100
            }
        }
    }

    const getPct = (val: number) => gapStats.total > 0 ? Math.round((val / gapStats.total) * 100) : 0

    return (
        <div className="space-y-12 pb-20">
            <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">Progress & Insights</h1>
                <p className="text-muted-foreground mt-2 font-medium text-lg">Diagnostic view of your academic growth.</p>
            </div>

            {/* Pillar 1: Growth Analytics */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-xs font-mono font-bold">
                    <TrendingUp size={14} /> 01. Growth Analytics
                </div>
                <AnalyticsCharts
                    xpData={cumulativeXpData}
                    examScoreData={examScoreData}
                    subjectData={subjectData}
                    currentStats={{
                        xp: student.xp || 0,
                        streak: student.streak || 0,
                        level: student.level || 1,
                        totalExams: approvedExams.length
                    }}
                />
            </section>

            {/* Pillar 2: Problem Areas & Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 text-amber-500 uppercase tracking-widest text-[10px] font-mono font-bold">
                        <AlertCircle size={14} /> 02. Grade Simulation
                    </div>
                    {lastExamStats.maxScore > 0 ? (
                        <PredictiveGradeSandbox initialStats={lastExamStats} />
                    ) : (
                        <GlassCard variant="neu" className="p-8 text-center text-muted-foreground italic border-dashed">
                            No approved exam data to simulate. Complete an exam to unlock the sandbox.
                        </GlassCard>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-destructive uppercase tracking-widest text-[10px] font-mono font-bold">
                        <AlertCircle size={14} /> 03. Global Gaps
                    </div>
                    <GlassCard variant="neu" className="h-full p-6">
                        <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                            <BarChart2 size={18} className="text-muted-foreground" />
                            Gap Diagnostic
                        </h3>
                        {gapStats.total > 0 ? (
                            <div className="space-y-6">
                                <GapMetric label="Concept Errors" pct={getPct(gapStats.concept)} color="red" />
                                <GapMetric label="Calculation Errors" pct={getPct(gapStats.calculation)} color="amber" />
                                <GapMetric label="Keywords Missed" pct={getPct(gapStats.keyword)} color="blue" />

                                {getPct(gapStats.concept) > 40 && (
                                    <div className="mt-8 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 shadow-sm">
                                        <h4 className="font-bold text-destructive text-sm mb-1">AI Recommendation</h4>
                                        <p className="text-xs text-foreground/80 leading-relaxed">
                                            Your concept error rate is high. Focus on "Explain like I'm 5" sessions in the <strong>Library</strong>.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground text-sm italic">
                                No gap data recorded yet.
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Pillar 3: Detailed History */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-purple-500 uppercase tracking-widest text-[10px] font-mono font-bold">
                    <CheckCircle size={14} /> 04. Exam Archive
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {exams.length > 0 ? (
                        exams.map((sheet, i) => (
                            <ExamCard key={i} sheet={sheet} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-dashed border-border">
                            <p className="text-muted-foreground italic">No exams found in archive.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

function GapMetric({ label, pct, color }: { label: string, pct: number, color: string }) {
    const colorClasses: any = {
        red: "bg-red-500 text-red-600 dark:text-red-400",
        amber: "bg-amber-500 text-amber-600 dark:text-amber-400",
        blue: "bg-blue-500 text-blue-600 dark:text-blue-400"
    }

    return (
        <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-foreground/80">{label}</span>
                <span className={cn("font-bold", colorClasses[color].split(' ')[1])}>{pct}%</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden shadow-inner">
                <div className={cn("h-full transition-all duration-1000 rounded-full", colorClasses[color].split(' ')[0])} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

function ExamCard({ sheet }: { sheet: any }) {
    const examData = sheet.exams as any
    // Use feedbackData (snapshot from approval) first, fallback to exams table
    const feedbackAnalysis = sheet.feedback_analysis?.[0]
    const displayName = feedbackAnalysis?.exam_name || examData?.exam_name || "Unknown Exam"
    const displaySubject = feedbackAnalysis?.exam_subject || examData?.subject || 'General'
    const displayTotalMarks = feedbackAnalysis?.exam_total_marks || examData?.total_marks || '?'
    
    return (
        <GlassCard variant="neu" className="p-0 overflow-hidden hover:border-primary/30 transition-all group rounded-3xl">
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-105",
                        sheet.status === 'approved'
                            ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                    )}>
                        {sheet.status === 'approved' ? <CheckCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                            {displayName}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">
                            {displaySubject}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    {sheet.status === 'approved' ? (
                        <>
                            <div className="text-3xl font-display font-bold text-foreground">
                                {sheet.total_score} <span className="text-sm text-muted-foreground font-sans font-medium">/ {displayTotalMarks}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold mt-1">FINAL SCORE</div>
                        </>
                    ) : (
                        <span className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest shadow-sm">
                            Grading in Progress
                        </span>
                    )}
                </div>
            </div>

            {sheet.status === 'approved' && (
                <Link href={`/student/performance/${sheet.id}`}>
                    <div className="bg-secondary/30 border-t border-border/50 p-4 flex justify-between items-center group-hover:bg-primary/5 transition-colors cursor-pointer">
                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">Detailed Diagnostic Report</span>
                        <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-all transform group-hover:translate-x-1" />
                    </div>
                </Link>
            )}
        </GlassCard>
    )
}
