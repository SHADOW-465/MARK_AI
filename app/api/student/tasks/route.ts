import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { title, subjectId } = await req.json()
  if (!title?.trim()) return new NextResponse("Title required", { status: 400 })

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { data: task, error } = await supabase
    .from("student_tasks")
    .insert({
      student_id: student.id,
      title: title.trim(),
      status: "pending",
      subject_id: subjectId || null,
    })
    .select()
    .single()

  if (error) return new NextResponse("Error", { status: 500 })
  return NextResponse.json({ task }, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { taskId } = await req.json()

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { error } = await supabase
    .from("student_tasks")
    .delete()
    .eq("id", taskId)
    .eq("student_id", student.id)

  if (error) return new NextResponse("Error", { status: 500 })
  return new NextResponse(null, { status: 204 })
}
