"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { extractTextFromPDF, isPDF } from "@/lib/pdf-extract"

export async function uploadStudyMaterial(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Get student ID
    const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

    if (studentError || !student) {
        return { error: "Student profile not found. Please complete onboarding first." }
    }

    const file = formData.get("file") as File
    if (!file) return { error: "No file provided" }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'bin'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${student.id}/${fileName}`

    const BUCKET_NAME = 'study_materials' // Using underscore as per schema comment

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file)

    if (uploadError) {
        console.error("Storage upload error:", uploadError)
        return { error: `Upload failed: ${uploadError.message}. Ensure the '${BUCKET_NAME}' bucket exists and is public.` }
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    // 2. Text Extraction
    let extractedText = null

    try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            // Plain text files
            extractedText = await file.text()
        } else if (isPDF(file.name, file.type)) {
            // PDF files - extract text
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            extractedText = await extractTextFromPDF(buffer)
        } else {
            extractedText = `[Generic file: ${file.name}]`
        }
    } catch (extractError) {
        console.error('Extraction error:', extractError)
        extractedText = `[Text extraction failed for ${file.name}]`
    }

    // 3. Insert Record
    const { error: dbError } = await supabase.from("study_materials").insert({
        student_id: student.id,
        title: file.name,
        file_url: publicUrlData.publicUrl,
        file_type: fileExt,
        extracted_text: extractedText || `[No text content: ${file.name}]`
    })

    if (dbError) {
        console.error("DB insert error:", dbError)
        return { error: `Database error: ${dbError.message}` }
    }

    revalidatePath("/student/study")
    return { success: true }
}
