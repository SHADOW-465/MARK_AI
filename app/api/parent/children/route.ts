import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Get parent
    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!parent) {
      return NextResponse.json({ children: [] })
    }
    
    // Get children with stats
    const { data: mappings } = await supabase
      .from('parent_student_mapping')
      .select(`
        relation,
        verified_at,
        students (
          id, name, class, roll_number, xp, streak, level,
          answer_sheets (
            total_score,
            exams (total_marks)
          )
        )
      `)
      .eq('parent_id', parent.id)
    
    const children = mappings?.map((m: any) => {
      const student = m.students
      const sheets = student.answer_sheets || []
      const avgScore = sheets.length > 0
        ? Math.round(sheets.reduce((acc: number, s: any) => {
            const max = s.exams?.total_marks || 100
            return acc + ((s.total_score || 0) / max) * 100
          }, 0) / sheets.length)
        : 0
      
      return {
        id: student.id,
        name: student.name,
        class: student.class,
        rollNumber: student.roll_number,
        relation: m.relation,
        xp: student.xp,
        streak: student.streak,
        level: student.level,
        avgScore,
        examCount: sheets.length
      }
    }) || []
    
    return NextResponse.json({ children })
  } catch (error: any) {
    console.error('Children fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
