import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import * as XLSX from 'xlsx'

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
    
    // Transform data for Excel
    const rows = sheets?.map((sheet: any, index: number) => ({
      'S.No': index + 1,
      'Roll Number': sheet.students?.roll_number || 'N/A',
      'Student Name': sheet.students?.name || 'Unknown',
      'Class': sheet.students?.class || exam.class,
      'Score': sheet.total_score || 0,
      'Max Marks': exam.total_marks,
      'Percentage': sheet.total_score 
        ? Math.round((sheet.total_score / exam.total_marks) * 100) + '%'
        : '0%',
      'Status': sheet.status,
      'Date': new Date(sheet.created_at).toLocaleDateString()
    })) || []
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['MARK AI - Exam Results'],
      [''],
      ['Exam Name:', exam.exam_name],
      ['Subject:', exam.subject],
      ['Class:', exam.class],
      ['Total Marks:', exam.total_marks],
      ['Total Students:', rows.length],
      ['Average Score:', rows.length > 0 
        ? Math.round(rows.reduce((acc, r) => acc + (r.Score as number), 0) / rows.length)
        : 0
      ],
      ['Generated:', new Date().toLocaleString()]
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
    
    // Results sheet
    const resultsSheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, resultsSheet, 'Results')
    
    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    // Return file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${exam.exam_name.replace(/[^a-z0-9]/gi, '_')}_results.xlsx"`
      }
    })
  } catch (error: any) {
    console.error('Excel export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
