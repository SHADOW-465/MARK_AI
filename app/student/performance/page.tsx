import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, Clock, ArrowRight, TrendingUp } from "lucide-react"
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

    // 2. Fetch Answer Sheets with Exam details
    const { data: sheets } = await supabase
        .from("answer_sheets")
        .select(`
            id,
            total_score,
            status,
            exam_id,
            exams!left (exam_name, total_marks, subject)
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })

    const exams = sheets || []
    const approvedExams = exams.filter(e => e.status === 'approved')

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

    const examScoreData = approvedExams.map((sheet: any) => ({
        name: sheet.exams?.exam_name || 'Exam',
        score: sheet.total_score,
        total: sheet.exams?.total_marks || 100,
        percentage: Math.round((sheet.total_score / (sheet.exams?.total_marks || 100)) * 100),
        subject: sheet.exams?.subject || 'General'
    })).reverse()

    const subjectPerformance: Record<string, { scores: number[], total: number }> = {}
    approvedExams.forEach((sheet: any) => {
        const subject = sheet.exams?.subject || 'General'
        const percentage = (sheet.total_score / (sheet.exams?.total_marks || 100)) * 100
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
        const feedback = feedbackList?.find((f: any) => f.answer_sheet_id === latestApproved.id)
        if (feedback && feedback.root_cause_analysis) {
            const r = feedback.root_cause_analysis
            lastExamStats = {
                concept: Number(r.concept || 0),
                calculation: Number(r.calculation || 0),
                keyword: Number(r.keyword || 0),
                currentGrade: latestApproved.total_score,
                maxScore: latestApproved.exams?.total_marks || 100
            }
        }
    }

    const getPct = (val: number) => gapStats.total > 0 ? Math.round((val / gapStats.total) * 100) : 0

    return (
        <div className="space-y-12 pb-20">
            <div>
                <h1 className="text-3xl font-display font-bold">Progress & Insights</h1>
                <p className="text-muted-foreground mt-1">Diagnostic view of your academic growth and areas for adjustment.</p>
            </div>

            {/* Pillar 1: Growth Analytics */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-neon-cyan uppercase tracking-widest text-[10px] font-mono">
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
                    <div className="flex items-center gap-2 text-amber-500 uppercase tracking-widest text-[10px] font-mono">
                        <AlertCircle size={14} /> 02. Grade Simulation
                    </div>
                    {lastExamStats.maxScore > 0 ? (
                        <PredictiveGradeSandbox initialStats={lastExamStats} />
                    ) : (
                        <GlassCard className="p-8 text-center text-muted-foreground italic border-dashed">
                            No approved exam data to simulate. Complete an exam to unlock the sandbox.
                        </GlassCard>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-red-500 uppercase tracking-widest text-[10px] font-mono">
                        <AlertCircle size={14} /> 03. Global Gaps
                    </div>
                    <GlassCard className="h-full p-6">
                        <h3 className="text-lg font-bold mb-6">Gap Diagnostic</h3>
                        {gapStats.total > 0 ? (
                            <div className="space-y-6">
                                <GapMetric label="Concept Errors" pct={getPct(gapStats.concept)} color="red" />
                                <GapMetric label="Calculation Errors" pct={getPct(gapStats.calculation)} color="amber" />
                                <GapMetric label="Keywords Missed" pct={getPct(gapStats.keyword)} color="blue" />

                                {getPct(gapStats.concept) > 40 && (
                                    <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <h4 className="font-bold text-red-400 text-sm mb-1">AI Recommendation</h4>
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
                <div className="flex items-center gap-2 text-neon-purple uppercase tracking-widest text-[10px] font-mono">
                    <CheckCircle size={14} /> 04. Exam Archive
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {exams.length > 0 ? (
                        exams.map((sheet, i) => (
                            <ExamCard key={i} sheet={sheet} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-xl border border-white/5 border-dashed">
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
        red: "bg-red-500 text-red-400",
        amber: "bg-amber-500 text-amber-400",
        blue: "bg-blue-500 text-blue-400"
    }
    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span>{label}</span>
                <span className={cn("font-bold", colorClasses[color].split(' ')[1])}>{pct}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-1000", colorClasses[color].split(' ')[0])} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

function ExamCard({ sheet }: { sheet: any }) {
    return (
        <GlassCard className="p-0 overflow-hidden hover:border-neon-cyan/30 transition-all group">
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center border",
                        sheet.status === 'approved'
                            ? "bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}>
                        {sheet.status === 'approved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-lg group-hover:text-neon-cyan transition-colors">
                            {sheet.exams?.exam_name || "Unknown Exam"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {sheet.exams?.subject || 'General'}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    {sheet.status === 'approved' ? (
                        <>
                            <div className="text-2xl font-bold font-display">
                                {sheet.total_score} <span className="text-sm text-muted-foreground font-sans font-normal">/ {sheet.exams?.total_marks || '?'}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">FINAL SCORE</div>
                        </>
                    ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                            Grading in Progress
                        </span>
                    )}
                </div>
            </div>

            {sheet.status === 'approved' && (
                <Link href={`/student/performance/${sheet.id}`}>
                    <div className="bg-white/5 border-t border-white/5 p-4 flex justify-between items-center group-hover:bg-neon-cyan/5 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Detailed Diagnostic Report</span>
                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-neon-cyan transition-all transform group-hover:translate-x-1" />
                    </div>
                </Link>
            )}
        </GlassCard>
    )
}
