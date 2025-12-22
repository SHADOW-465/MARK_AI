import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function PerformanceLab() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch Student
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user?.id)
    .single()

  let exams: any[] = []
  let gapStats = { concept: 0, calculation: 0, keyword: 0, total: 0 }
  let lastExamStats = { concept: 0, calculation: 0, keyword: 0, currentGrade: 0, maxScore: 100 }

  if (student) {
    // Fetch Answer Sheets with Exam details
    const { data: sheets } = await supabase
      .from("answer_sheets")
      .select(`
        id,
        total_score,
        status,
        created_at,
        exam:exams (exam_name, total_marks, subject)
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })

    exams = sheets || []

    // Fetch Feedback Analysis for Gap Stats (Global Accumulation)
    const { data: feedbackList } = await supabase
        .from("feedback_analysis")
        .select("root_cause_analysis, answer_sheet_id")
        .eq("student_id", student.id)

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

    // Prepare Data for Predictive Sandbox (Based on LATEST APPROVED EXAM)
    const latestApproved = exams.find(e => e.status === 'approved')
    if (latestApproved) {
        const feedback = feedbackList?.find((f: any) => f.answer_sheet_id === latestApproved.id)
        if (feedback && feedback.root_cause_analysis) {
            const r = feedback.root_cause_analysis
            lastExamStats = {
                concept: Number(r.concept || 0),
                calculation: Number(r.calculation || 0),
                keyword: Number(r.keyword || 0),
                currentGrade: latestApproved.total_score,
                maxScore: latestApproved.exam?.total_marks || 100
            }
        }
    }
  }

  // Calculate Percentages
  const getPct = (val: number) => gapStats.total > 0 ? Math.round((val / gapStats.total) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Performance Lab</h1>
        <p className="text-muted-foreground">Analyze your results and close the gaps.</p>
      </div>

      {/* Predictive Sandbox */}
      {lastExamStats.maxScore > 0 && (
         <PredictiveGradeSandbox initialStats={lastExamStats} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exam History List */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold mb-4">Exam History</h3>

            {exams.length > 0 ? (
                exams.map((sheet, i) => (
                    <GlassCard key={i} className="p-0 overflow-hidden hover:border-neon-cyan/30 transition-colors group">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center border",
                                    sheet.status === 'approved'
                                        ? "bg-green-500/10 border-green-500/20 text-green-500"
                                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                )}>
                                    {sheet.status === 'approved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-lg">
                                        {sheet.exam?.exam_name || "Unknown Exam"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {sheet.exam?.subject} • {new Date(sheet.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                {sheet.status === 'approved' ? (
                                    <>
                                        <div className="text-2xl font-bold font-display">
                                            {sheet.total_score} <span className="text-sm text-muted-foreground font-sans font-normal">/ {sheet.exam?.total_marks}</span>
                                        </div>
                                        <div className="text-xs font-mono text-muted-foreground">SCORE</div>
                                    </>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                                        Under Review
                                    </span>
                                )}
                            </div>
                        </div>

                        {sheet.status === 'approved' && ( // Change from 'graded' to 'approved'
                            <Link href={`/student/performance/${sheet.id}`}>
                                <div className="bg-white/5 border-t border-white/5 p-4 flex justify-between items-center group-hover:bg-white/10 transition-colors cursor-pointer">
                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">View Full Analysis & Gap Report</span>
                                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                                </div>
                            </Link>
                        )}
                    </GlassCard>
                ))
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/5 border-dashed">
                    <p className="text-muted-foreground">No exams found.</p>
                </div>
            )}
        </div>

        {/* Gap Analysis Summary (Real Data) */}
        <div className="lg:col-span-1">
             <GlassCard className="h-full p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <AlertCircle className="text-red-500" size={20} />
                    Gap Analysis
                </h3>

                {gapStats.total > 0 ? (
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Concept Errors</span>
                                <span className="text-red-400 font-bold">{getPct(gapStats.concept)}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{width: `${getPct(gapStats.concept)}%`}} />
                            </div>
                            {getPct(gapStats.concept) > 40 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    You mostly lose marks because you misunderstood the core principle.
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Calculation Errors</span>
                                <span className="text-amber-400 font-bold">{getPct(gapStats.calculation)}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{width: `${getPct(gapStats.calculation)}%`}} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Keywords Missed</span>
                                <span className="text-blue-400 font-bold">{getPct(gapStats.keyword)}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{width: `${getPct(gapStats.keyword)}%`}} />
                            </div>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-10 text-muted-foreground">
                        <p>No gap data available yet. Complete an exam to see analysis.</p>
                     </div>
                )}

                {gapStats.total > 0 && getPct(gapStats.concept) > 40 && (
                    <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="font-bold text-red-400 text-sm mb-2">Recommendation</h4>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                            Your concept error rate is high. Use the <strong>Deep Work Studio</strong> to ask &quot;Explain like I&apos;m 5&quot; for the topics you missed in the last exam.
                        </p>
                    </div>
                )}
             </GlassCard>
        </div>
      </div>
    </div>
  )
}
