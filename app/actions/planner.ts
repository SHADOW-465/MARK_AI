"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Get student ID
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single()
    if (!student) return { error: "Student not found" }

    const title = formData.get("title") as string
    const type = formData.get("type") as string
    const duration = formData.get("duration") as string
    const priority = formData.get("priority") as string

    const { error } = await supabase.from("student_tasks").insert({
        student_id: student.id,
        title,
        type,
        estimated_duration: parseInt(duration),
        priority,
        status: "pending"
    })

    if (error) return { error: error.message }
    revalidatePath("/student/planner")
    return { success: true }
}

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
    const supabase = await createClient()
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

    await supabase.from("student_tasks").update({ status: newStatus }).eq("id", taskId)
    revalidatePath("/student/planner")
}
