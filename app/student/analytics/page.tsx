import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsCharts } from "@/components/student/analytics-charts"

export const dynamic = 'force-dynamic'

export default async function StudentAnalytics() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/auth/login")

    // Get student
    const { data: student } = await supabase
        .from("students")
        .select("id, name, xp, streak, level")
        .eq("user_id", user.id)
        .single()

    if (!student) {
        return <div className="text-center py-20 text-muted-foreground">Student record not found.</div>
    }

    // Fetch XP logs for chart (xp_logs table has created_at)
    const { data: xpLogs } = await supabase
        .from("xp_logs")
        .select("amount, activity_type, created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: true })
        .limit(50)

    // Fetch exam history (use left join for deleted exams, don't use created_at from answer_sheets)
    const { data: examHistory } = await supabase
        .from("answer_sheets")
        .select(`
            id,
            total_score,
            exam_id,
            exams!left (exam_name, total_marks, subject)
        `)
        .eq("student_id", student.id)
        .eq("status", "approved")

    // Aggregate data for charts
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

    // Cumulative XP
    let cumulativeXP = 0
    const cumulativeXpData = xpChartData.map(d => {
        cumulativeXP += d.xp
        return { ...d, totalXp: cumulativeXP }
    })

    // Exam scores chart
    const examScoreData = examHistory?.map((sheet: any) => ({
        name: sheet.exams?.exam_name || 'Exam',
        score: sheet.total_score,
        total: sheet.exams?.total_marks || 100,
        percentage: Math.round((sheet.total_score / (sheet.exams?.total_marks || 100)) * 100),
        subject: sheet.exams?.subject || 'General'
    })) || []

    // Subject-wise performance
    const subjectPerformance: Record<string, { scores: number[], total: number }> = {}
    examHistory?.forEach((sheet: any) => {
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1">Track your progress over time</p>
            </div>

            <AnalyticsCharts
                xpData={cumulativeXpData}
                examScoreData={examScoreData}
                subjectData={subjectData}
                currentStats={{
                    xp: student.xp || 0,
                    streak: student.streak || 0,
                    level: student.level || 1,
                    totalExams: examHistory?.length || 0
                }}
            />
        </div>
    )
}
