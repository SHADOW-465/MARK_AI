import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('exam_id')
    
    if (!examId) {
      return NextResponse.json({ error: 'exam_id required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Fetch exam details
    const { data: exam } = await supabase
      .from('exams')
      .select('exam_name, subject, class, total_marks')
      .eq('id', examId)
      .single()
    
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }
    
    // Fetch answer sheets with student info
    const { data: sheets } = await supabase
      .from('answer_sheets')
      .select(`
        id, total_score, status, created_at,
        students (name, roll_number, class)
      `)
      .eq('exam_id', examId)
      .order('created_at', { ascending: true })
    
    // CSV Header (Google Classroom compatible)
    const headers = ['student_id', 'name', 'roll_number', 'class', 'exam_name', 'score', 'max_score', 'status', 'date']
    
    // CSV Rows
    const rows = sheets?.map((sheet: any) => [
      sheet.students?.roll_number || 'N/A',
      sheet.students?.name || 'Unknown',
      sheet.students?.roll_number || 'N/A',
      sheet.students?.class || exam.class,
      exam.exam_name,
      sheet.total_score || 0,
      exam.total_marks,
      sheet.status,
      new Date(sheet.created_at).toISOString().split('T')[0]
    ]) || []
    
    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(','))
    ].join('\n')
    
    // Return file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${exam.exam_name.replace(/[^a-z0-9]/gi, '_')}_results.csv"`
      }
    })
  } catch (error: any) {
    console.error('CSV export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
