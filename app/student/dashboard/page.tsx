import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, CheckCircle2, MoreHorizontal, Send } from "lucide-react"
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
        <div className="w-full animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                {/* --- LEFT COLUMN: Statistic Profile --- */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-display font-semibold text-foreground">Statistic</h2>
                        <Button variant="ghost" className="h-8 rounded-full text-xs font-semibold px-4 bg-secondary/50 hover:bg-secondary">
                            View all
                        </Button>
                    </div>

                    {/* Circular Profile Avatar */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative w-32 h-32 mb-4">
                            {/* Background ring */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" className="stroke-secondary" strokeWidth="6" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none"
                                    className="stroke-[var(--student-primary)]"
                                    strokeWidth="6" strokeLinecap="round"
                                    style={{ strokeDasharray, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                                />
                            </svg>
                            {/* Avatar image / Initial */}
                            <div className="absolute inset-2 rounded-full overflow-hidden bg-muted border-4 border-background flex items-center justify-center text-4xl font-display font-bold text-muted-foreground shadow-sm">
                                {student.name.charAt(0)}
                            </div>
                            {/* Level Badge overlapping bottom edge */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--student-primary)] text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-background shadow-sm whitespace-nowrap">
                                Lvl {student.level || "Beginner"}
                            </div>
                        </div>

                        <h3 className="text-2xl font-display font-medium text-foreground text-center">
                            Welcome, {student.name.split(' ')[0]} 👋
                        </h3>
                    </div>

                    {/* Total month activity */}
                    <div className="mb-8">
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-5xl font-display font-bold text-foreground leading-none">{profileProgress}%</span>
                            <span className="text-sm text-muted-foreground font-medium pb-1 leading-tight">Total month<br />activity</span>
                        </div>

                        {/* 3-segment progress bar */}
                        <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-1 mt-4">
                            <div className="bg-[#b388ff] h-full rounded-l-full" style={{ width: '42%' }}></div>
                            <div className="bg-[#fad02c] h-full" style={{ width: '15%' }}></div>
                            <div className="bg-[#ff6b4a] h-full rounded-r-full" style={{ width: '56%' }}></div>
                        </div>
                        <div className="flex justify-between w-full text-[10px] font-bold text-muted-foreground mt-2 px-1">
                            <span className="w-[42%]">42%</span>
                            <span className="w-[15%]">15%</span>
                            <span className="w-[30%]">56%</span>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 bg-secondary/30 rounded-3xl p-4 border border-border/50">
                        {/* In progress */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#b388ff] flex items-center justify-center">
                                <Clock size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-display font-bold text-foreground">{pendingCount || 0}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground text-center line-clamp-1">In progress</span>
                        </div>
                        {/* Upcoming */}
                        <div className="flex flex-col items-center justify-center gap-2 border-x border-border/60">
                            <div className="w-10 h-10 rounded-full bg-[#fef9c3] text-[#eab308] flex items-center justify-center">
                                <CalendarIcon size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-display font-bold text-foreground">{upcomingCount || 0}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground text-center line-clamp-1">Upcoming</span>
                        </div>
                        {/* Completed */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#ffe4e6] text-[#fe6b4a] flex items-center justify-center">
                                <CheckCircle2 size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-display font-bold text-foreground">{completedCount || 0}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground text-center line-clamp-1">Completed</span>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Main content area --- */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">

                    {/* TOP HALF: Your Courses (Orange card) */}
                    <div className="w-full bg-[var(--student-primary)] text-white rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-[var(--student-primary)]/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-display font-medium">Your courses</h2>
                            <div className="flex gap-2 items-center">
                                <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                                <Button variant="secondary" className="bg-white text-[var(--student-primary)] hover:bg-white/90 rounded-full text-xs font-semibold px-5 h-8 ml-2">
                                    View all
                                </Button>
                            </div>
                        </div>

                        {/* Horizontal scrolling courses */}
                        <div className="flex overflow-x-auto gap-5 pb-2 snap-x hide-scrollbar">
                            {coursesToShow.map((course, idx) => (
                                <div key={idx} className="min-w-[260px] md:min-w-[280px] bg-background text-foreground rounded-3xl p-5 flex flex-col justify-between snap-start shadow-md hover:shadow-lg transition-shadow">
                                    <div>
                                        <h3 className="font-display font-semibold text-lg mb-3">{course.title}</h3>
                                        <div className="flex items-center gap-2 mb-8">
                                            <span className="bg-secondary text-muted-foreground text-[10px] uppercase font-bold px-2 py-1 rounded-md">
                                                {course.level}
                                            </span>
                                            <span className="bg-destructive/10 text-destructive text-[10px] uppercase font-bold px-2 py-1 rounded-md">
                                                {course.classes}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold">{course.progress}% completed</span>
                                        </div>
                                        <div className="w-full bg-secondary h-1.5 rounded-full mb-4 overflow-hidden">
                                            <div className="bg-[var(--student-primary)] h-full rounded-full" style={{ width: `${course.progress}%` }}></div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#f3e8ff] flex items-center justify-center overflow-hidden shrink-0">
                                                <span className="text-xs font-bold text-[#b388ff]">{course.mentorName[0]}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Mentor</span>
                                                <span className="text-xs font-bold leading-tight">{course.mentorName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BOTTOM HALF: Charts and AI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[300px]">

                        {/* Bottom Left: Study process bar chart */}
                        <div className="bg-background rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between shadow-sm border border-border/60">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-display font-semibold text-foreground">Study proccess</h3>
                                <select className="bg-secondary/50 border border-border/50 rounded-full px-4 py-1.5 text-xs font-semibold focus:outline-none appearance-none cursor-pointer">
                                    <option>Week v</option>
                                    <option>Month v</option>
                                </select>
                            </div>

                            {/* Custom Bar Chart mimicking the design */}
                            <div className="flex items-end justify-between h-48 w-full px-2 gap-2 sm:gap-4 mt-auto">
                                {/* Engage */}
                                <div className="flex flex-col items-center gap-3 h-full justify-end flex-1 group">
                                    <div className="relative w-full bg-secondary/60 rounded-t-xl group-hover:bg-secondary transition-colors" style={{ height: '66%' }}>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--student-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">66%</div>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">Engage</span>
                                </div>
                                {/* Grow */}
                                <div className="flex flex-col items-center gap-3 h-full justify-end flex-1 group">
                                    <div className="relative w-full bg-secondary/60 rounded-t-xl group-hover:bg-secondary transition-colors" style={{ height: '40%' }}>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--student-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">40%</div>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">Grow</span>
                                </div>
                                {/* Skills (Highlighted) */}
                                <div className="flex flex-col items-center gap-3 h-full justify-end flex-1">
                                    <div className="relative w-full bg-[var(--student-primary)] rounded-t-xl shadow-md shadow-[var(--student-primary)]/20" style={{ height: '87%' }}>
                                        <div className="absolute -top-3 -left-3 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full z-10">87%</div>
                                    </div>
                                    <span className="text-xs font-bold text-foreground">Skills</span>
                                </div>
                                {/* Rate */}
                                <div className="flex flex-col items-center gap-3 h-full justify-end flex-1 group">
                                    <div className="relative w-full bg-secondary/60 rounded-t-xl group-hover:bg-secondary transition-colors" style={{ height: '56%' }}>
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--student-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">56%</div>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground">Rate</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Right: AI assistant */}
                        <div className="rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-end min-h-[250px] shadow-sm border border-[var(--student-primary)]/10"
                            style={{ background: 'linear-gradient(135deg, #ffd3e0 0%, #fecfef 50%, #e8dbff 100%)' }}>

                            {/* Decorative background overlay (simulating the pink glassy graphic) */}
                            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                                <div className="absolute top-0 right-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
                                <div className="absolute bottom-10 -left-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl"></div>
                            </div>

                            {/* Top right badges */}
                            <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                                <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
                                    <Model size={14} className="text-foreground" />
                                    <span className="text-xs font-bold text-foreground">Model</span>
                                </div>
                                <button className="w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center shadow-sm">
                                    <MoreHorizontal size={14} className="text-foreground" />
                                </button>
                            </div>

                            {/* Input Container */}
                            <div className="bg-background/90 backdrop-blur-xl rounded-[1.5rem] p-5 lg:p-6 z-10 shadow-lg border border-border/40">
                                <h3 className="font-display font-semibold text-foreground mb-4 text-xl">AI assistant</h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Ask something..."
                                        className="w-full bg-secondary/80 border-none rounded-full pl-5 pr-14 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--student-primary)]/50 placeholder:text-muted-foreground"
                                    />
                                    <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--student-primary)] text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md">
                                        <Send size={16} className="ml-[-2px] mt-[1px]" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
