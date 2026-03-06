import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { subjectId, durationMinutes, notes } = await req.json()
  if (!subjectId || !durationMinutes) return new NextResponse("Missing fields", { status: 400 })

  const { data: session, error } = await admin
    .from("study_sessions")
    .insert({
      student_id: student.id,
      subject_id: subjectId,
      duration_minutes: durationMinutes,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return new NextResponse("Error", { status: 500 })
  return NextResponse.json({ session }, { status: 201 })
}
