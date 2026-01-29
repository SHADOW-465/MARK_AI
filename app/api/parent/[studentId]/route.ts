import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Verify parent has access to this student
    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 })
    }
    
    const { data: mapping } = await supabase
      .from('parent_student_mapping')
      .select('id')
      .eq('parent_id', parent.id)
      .eq('student_id', studentId)
      .single()
    
    if (!mapping) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Fetch student details
    const { data: student } = await supabase
      .from('students')
      .select(`
        id, name, class, roll_number, xp, streak, level, last_active_at,
        answer_sheets (
          id, total_score, created_at, status,
          exams (exam_name, subject, total_marks, exam_date)
        )
      `)
      .eq('id', studentId)
      .single()
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    
    // Calculate performance metrics
    const sheets = student.answer_sheets || []
    const approvedSheets = sheets.filter((s: any) => s.status === 'approved')
    
    const avgScore = approvedSheets.length > 0
      ? Math.round(approvedSheets.reduce((acc: number, s: any) => {
          const max = s.exams?.total_marks || 100
          return acc + ((s.total_score || 0) / max) * 100
        }, 0) / approvedSheets.length)
      : 0
    
    // Performance trend (last 5 exams)
    const trend = approvedSheets
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((s: any) => ({
        date: s.created_at,
        examName: s.exams?.exam_name,
        subject: s.exams?.subject,
        score: s.total_score,
        maxScore: s.exams?.total_marks,
        percentage: Math.round((s.total_score / (s.exams?.total_marks || 100)) * 100)
      }))
    
    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        class: student.class,
        rollNumber: student.roll_number,
        xp: student.xp,
        streak: student.streak,
        level: student.level,
        lastActive: student.last_active_at
      },
      performance: {
        avgScore,
        examCount: approvedSheets.length,
        trend
      }
    })
  } catch (error: any) {
    console.error('Student details error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
