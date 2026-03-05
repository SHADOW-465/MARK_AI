import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, CheckCircle2, MoreHorizontal, Send, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Please log in to view your dashboard.</div>
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
                <h1 className="text-3xl font-display font-bold">Account Link Required</h1>
                <p className="text-muted-foreground max-w-sm text-lg mx-auto">
                    We couldn't find your student profile. Ask your teacher to add you!
                </p>
                <Button asChild variant="default" className="px-6 py-3">
                    <Link href="/auth/sign-up">Try Linking Again <ArrowRight size={18} className="ml-2" /></Link>
                </Button>
            </div>
        )
    }

    // Task counts approximation for the UI metrics
    const { count: pendingCount } = await supabase.from("student_tasks").select("*", { count: 'exact', head: true }).eq("student_id", student.id).eq("status", "pending")
    const { count: completedCount } = await supabase.from("student_tasks").select("*", { count: 'exact', head: true }).eq("student_id", student.id).eq("status", "completed")

    // Upcoming Exams
    const { data: upcomingExams } = await supabase
        .from("exams")
        .select("id, exam_name, exam_date, subject")
        .eq("class", student.class)
        .gte("exam_date", new Date().toISOString().split('T')[0])
        .order("exam_date", { ascending: true })
        .limit(3)

    const upcomingCount = upcomingExams?.length || 0

    // Recent subjects as "Courses"
    const { data: recentExams } = await supabase
        .from("answer_sheets")
        .select(`
            id, total_score, status,
            exams (exam_name, total_marks, subject)
        `)
        .eq("student_id", student.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5)

    // Ensure we have some data for the 'courses' UI block to demonstrate the design
    const dummyCourses = [
        { title: "Design thinking", level: "Advanced", classes: "4/12 classes", progress: 46, mentorName: "Tomas Luis" },
        { title: "Leadership", level: "Beginner", classes: "8/14 classes", progress: 72, mentorName: "Nelly Roven" },
        { title: "IT English", level: "Advanced", classes: "6/10 classes", progress: 56, mentorName: "Stefan Colman" },
    ]

    const coursesToShow = recentExams && recentExams.length > 0
        ? recentExams.map((exam: any, i) => {
            const e = exam.exams
            const percent = e?.total_marks ? Math.round(((exam.total_score || 0) / e.total_marks) * 100) : dummyCourses[i % 3].progress
            return {
                title: e?.subject || e?.exam_name || dummyCourses[i % 3].title,
                level: "Advanced",
                classes: `${percent}% Score`,
                progress: percent,
                mentorName: "Instructor"
            }
        })
        : dummyCourses

    // Progress calculations for the profile ring
    const profileProgress = Math.min(100, Math.max(0, student.xp ? student.xp % 100 : 78))
    const strokeDasharray = 283 // 2 * pi * 45
    const strokeDashoffset = strokeDasharray - (strokeDasharray * profileProgress) / 100

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard Test</h1>
            <p>Welcome, {student.name?.split(' ')[0] || "Student"}</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary rounded-xl">Pending: {pendingCount || 0}</div>
                <div className="p-4 bg-secondary rounded-xl">Completed: {completedCount || 0}</div>
                <div className="p-4 bg-secondary rounded-xl">XP: {student.xp || 0}</div>
            </div>
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-2">Courses</h2>
                <ul className="space-y-2">
                    {coursesToShow.slice(0, 3).map((c, i) => (
                        <li key={i} className="p-3 border rounded-lg">
                            {c.title} - {c.progress}%
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
