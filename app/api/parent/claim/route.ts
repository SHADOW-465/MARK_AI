import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { rollNumber, dob, relation = 'guardian' } = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Get or create parent record
    let { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!parent) {
      const { data: newParent, error: createError } = await supabase
        .from('parents')
        .insert({
          user_id: user.id,
          name: user.user_metadata?.name || 'Parent',
          email: user.email
        })
        .select('id')
        .single()
      
      if (createError) throw createError
      parent = newParent
    }
    
    // Find student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, class')
      .ilike('roll_number', rollNumber.trim())
      .eq('dob', dob)
      .single()
    
    if (studentError || !student) {
      return NextResponse.json({ 
        error: 'Student not found. Please check Roll Number and Date of Birth.' 
      }, { status: 404 })
    }
    
    // Check if already claimed
    const { data: existing } = await supabase
      .from('parent_student_mapping')
      .select('id')
      .eq('parent_id', parent.id)
      .eq('student_id', student.id)
      .single()
    
    if (existing) {
      return NextResponse.json({ 
        error: 'You have already claimed this student.' 
      }, { status: 400 })
    }
    
    // Create mapping
    await supabase.from('parent_student_mapping').insert({
      parent_id: parent.id,
      student_id: student.id,
      relation,
      verified_at: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: true, 
      student: { id: student.id, name: student.name, class: student.class }
    })
  } catch (error: any) {
    console.error('Claim error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
