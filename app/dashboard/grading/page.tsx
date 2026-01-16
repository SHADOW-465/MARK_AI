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
                <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">
                    Grading
                </h1>
                <p className="text-muted-foreground mt-2 font-medium">
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
                            <GlassCard 
                                variant="liquid"
                                hoverEffect 
                                className="h-full p-6 flex flex-col justify-between group overflow-hidden relative border-l-4 border-l-transparent hover:border-l-primary"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FileText size={80} />
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        {progress === 100 && (
                                            <div className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                                                Complete
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {exam.exam_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-medium mt-1">
                                            {exam.subject} • Class {exam.class}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2 rounded-full" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users size={16} />
                                            <span>{totalSheets} Papers</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle size={16} />
                                            <span>{gradedSheets} Graded</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    )
                })}

                {exams?.length === 0 && (
                    <div className="col-span-full py-16 text-center text-muted-foreground bg-secondary/30 rounded-3xl border border-dashed border-border">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No exams found. Create an exam to start grading.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
