import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { ChevronRight, FileText, Users, CheckCircle, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export const dynamic = 'force-dynamic'

export default async function GradingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    // Fetch exams created by this teacher
    const { data: exams } = await supabase
        .from("exams")
        .select(`
            *,
            answer_sheets (id, status)
        `)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Grading
                </h1>
                <p className="text-muted-foreground mt-2">
                    Select an exam to manage submissions and grading.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {exams?.map((exam) => {
                    const totalSheets = exam.answer_sheets?.length || 0
                    const gradedSheets = exam.answer_sheets?.filter((s: any) => s.status === 'graded' || s.status === 'approved').length || 0
                    const progress = totalSheets > 0 ? (gradedSheets / totalSheets) * 100 : 0

                    return (
                        <Link key={exam.id} href={`/dashboard/grading/${exam.id}`}>
                            <GlassCard className="h-full p-6 hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <FileText size={64} />
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {exam.exam_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {exam.subject} • Class {exam.class}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Grading Progress</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users size={16} className="text-muted-foreground" />
                                            <span>{totalSheets} Submissions</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-500" />
                                            <span>{gradedSheets} Graded</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(exam.exam_date).toLocaleDateString()}
                                        </span>
                                        <span className="group-hover:translate-x-1 transition-transform text-primary flex items-center gap-1">
                                            Open <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    )
                })}

                {exams?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No exams found. Create an exam first.
                    </div>
                )}
            </div>
        </div>
    )
}
