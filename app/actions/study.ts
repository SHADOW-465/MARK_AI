"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { extractTextFromPDF, isPDF } from "@/lib/pdf-extract"

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
    const fileExt = file.name.split('.').pop() || 'bin'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${student.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(filePath, file)

    if (uploadError) {
        return { error: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from('study_materials').getPublicUrl(filePath)

    // 2. Text Extraction
    let extractedText = null

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // Plain text files
        extractedText = await file.text()
    } else if (isPDF(file.name, file.type)) {
        // PDF files - extract text
        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            extractedText = await extractTextFromPDF(buffer)
        } catch (error) {
            console.error('PDF extraction error:', error)
            extractedText = '[PDF text extraction failed]'
        }
    } else {
        extractedText = '[Image/binary content - no text extracted]'
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
