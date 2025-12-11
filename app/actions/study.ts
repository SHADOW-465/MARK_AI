"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadStudyMaterial(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Get student ID
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single()
    if (!student) return { error: "Student not found" }

    const file = formData.get("file") as File
    if (!file) return { error: "No file provided" }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${student.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(filePath, file)

    if (uploadError) {
        // If bucket doesn't exist, this fails.
        // Ideally we handle this, but for now we return error.
        return { error: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from('study_materials').getPublicUrl(filePath)

    // 2. Simple Text Extraction (Mock/Basic)
    // For real PDF extraction, we'd need a library.
    // Here we check if it's a text file.
    let extractedText = null
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await file.text()
    } else {
        extractedText = "[PDF/Image content extraction pending]"
    }

    // 3. Insert Record
    const { error: dbError } = await supabase.from("study_materials").insert({
        student_id: student.id,
        title: file.name,
        file_url: publicUrlData.publicUrl,
        file_type: fileExt,
        extracted_text: extractedText
    })

    if (dbError) return { error: dbError.message }

    revalidatePath("/student/study")
    return { success: true }
}
