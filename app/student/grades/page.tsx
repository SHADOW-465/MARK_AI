import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Calendar, Clock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

export default async function StudentGradesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/")

    // Fetch Student ID
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single()
    if (!student) return redirect("/")

    // Fetch All Approved Exams
    const { data: sheets } = await supabase
        .from("answer_sheets")
        .select(`
            id,
            total_score,
            created_at,
            status,
            review_status,
            exams (
                exam_name,
                subject,
                total_marks,
                exam_date
            )
        `)
        .eq("student_id", student.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })

    return (
        <div className="max-w-5xl mx-auto py-10 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                    <GraduationCap className="text-white w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">My Grades</h1>
                    <p className="text-slate-400">Track your performance and review feedback.</p>
                </div>
            </div>

            <div className="grid gap-4">
                {sheets && sheets.length > 0 ? (
                    sheets.map((sheet: any) => (
                        <Link href={`/student/grades/${sheet.id}`} key={sheet.id}>
                            <GlassCard className="p-6 flex items-center justify-between hover:border-indigo-500/50 transition-all group cursor-pointer bg-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-black/20 rounded-xl border border-white/5">
                                        <span className="text-xl font-bold text-white">{Math.round((sheet.total_score / sheet.exams.total_marks) * 100)}%</span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {sheet.exams?.exam_name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <GraduationCap size={14} /> {sheet.exams?.subject}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} /> {new Date(sheet.exams?.exam_date || sheet.created_at).toLocaleDateString()}
                                            </span>
                                            {sheet.review_status === 'requested' && (
                                                <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-[10px] h-5">
                                                    Review Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-2xl font-bold text-white">{sheet.total_score}</p>
                                        <p className="text-xs text-slate-500">/ {sheet.exams?.total_marks}</p>
                                    </div>
                                    <ArrowRight className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </GlassCard>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        <GraduationCap className="mx-auto text-slate-600 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-300">No grades yet</h3>
                        <p className="text-slate-500">Completed exams will appear here once graded.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
