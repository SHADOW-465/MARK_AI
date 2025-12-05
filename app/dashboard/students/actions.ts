"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteStudent(studentId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("students").delete().eq("id", studentId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/students")
}
