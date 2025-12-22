import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { CheckCircle, XCircle, AlertCircle, Brain, Target, Sparkles, TrendingUp } from "lucide-react"

export default async function StudentResultDetailPage({
    params,
}: {
    params: Promise<{ sheetId: string }>
}) {
    const { sheetId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Please log in</div>

    // Fetch Sheet with Exam and Results
    const { data: sheet } = await supabase
        .from("answer_sheets")
        .select(`
      *,
      exams (*),
      question_evaluations (*),
      feedback_analysis (*)
    `)
        .eq("id", sheetId)
        .single()

    if (!sheet || sheet.status !== 'approved') return notFound()

    // Verify ownership
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single()
    if (!student || sheet.student_id !== student.id) return notFound()

    const evals = sheet.question_evaluations?.sort((a: any, b: any) => a.question_num - b.question_num) || []
    const feedback = sheet.feedback_analysis?.[0]

    return (
        <div className="space-y-8 pb-24 lg:pb-0">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        Result: {sheet.exams.exam_name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {sheet.exams.subject} • Approved on {new Date(sheet.approved_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-display font-bold text-neon-cyan">
                        {sheet.total_score} <span className="text-xl text-muted-foreground font-normal">/ {sheet.exams.total_marks}</span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-1">Final Score</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main: Question by Question Analysis */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Target size={20} className="text-neon-cyan" />
                        Detailed Question Analysis
                    </h2>

                    {evals.map((ev: any) => {
                        const question = sheet.exams.marking_scheme.find((q: any) => q.question_num === ev.question_num)
                        const isFullMarks = ev.final_score >= (question?.max_marks || 0)

                        return (
                            <GlassCard key={ev.id} className="p-0 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-slate-400">Q{ev.question_num}</span>
                                            <h4 className="font-bold text-foreground leading-relaxed">
                                                {question?.question_text || "Question details not found"}
                                            </h4>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-sm",
                                            isFullMarks ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-foreground"
                                        )}>
                                            {ev.final_score} / {question?.max_marks}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Answer</p>
                                            <div className="p-3 bg-black/20 rounded-lg text-sm text-slate-300 font-mono italic">
                                                &quot;{ev.extracted_text || "No text detected."}&quot;
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Teacher Feedback</p>
                                            <div className="flex gap-2">
                                                {isFullMarks ? <CheckCircle size={16} className="text-emerald-500 mt-1 shrink-0" /> : <AlertCircle size={16} className="text-amber-500 mt-1 shrink-0" />}
                                                <p className="text-sm text-slate-300 leading-relaxed">
                                                    {ev.reasoning || "No detailed feedback provided."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        )
                    })}
                </div>

                {/* Sidebar: Student OS Insights */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles size={20} className="text-neon-purple" />
                        Performance Insights
                    </h2>

                    <GlassCard className="p-6 space-y-6 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border-white/10">
                        <div>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                <Brain size={16} className="text-neon-purple" />
                                Knowledge Gap (Root Cause)
                            </h3>
                            <div className="space-y-4">
                                {feedback?.root_cause_analysis && Object.entries(feedback.root_cause_analysis).map(([key, val]: any) => (
                                    <div key={key}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="capitalize">{key} Accuracy</span>
                                            <span className="text-slate-400">{val} Lost</span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    key === 'concept' ? 'bg-red-500' : key === 'calculation' ? 'bg-amber-500' : 'bg-blue-500'
                                                )}
                                                style={{ width: `${Math.max(0, 100 - (val * 10))}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-emerald-400">
                                <Target size={16} />
                                High ROI Areas
                            </h3>
                            <div className="space-y-2">
                                {feedback?.focus_areas?.map((area: string, i: number) => (
                                    <div key={i} className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                                        {area}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <h3 className="font-bold text-sm mb-2">Teacher&apos;s Strategy</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                {sheet.gemini_response?.overall_feedback || "Focus on the highlighted areas to improve your next result."}
                            </p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-neon-cyan/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <TrendingUp size={16} className="text-neon-cyan" />
                            Real-World Link
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                            {feedback?.real_world_application || "No context provided."}
                        </p>
                        <Link
                            href="/student/study"
                            className="text-[10px] font-mono text-neon-cyan uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            Ask AI for deep dive <Zap size={10} />
                        </Link>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}

import { Zap } from "lucide-react"
import Link from "next/link"
