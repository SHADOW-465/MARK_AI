import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractTextFromFile } from "@/lib/sarvam-ocr"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const studentId = formData.get("student_id") as string

        if (!file || !studentId) {
            return NextResponse.json({ error: "Missing file or student_id" }, { status: 400 })
        }

        // 1. Upload to Supabase Storage (use anon key client for storage — bucket policies handle auth)
        const storageClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const fileExt = file.name.split(".").pop()
        const fileName = `${studentId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await storageClient.storage
            .from("student_sources")
            .upload(fileName, file)

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_sources/${fileName}`

        // 2. Extract text via Sarvam AI / pdf-parse
        const { text: ocrText, method } = await extractTextFromFile(file)
        console.log(`[upload] ${file.name} → method: ${method}, chars: ${ocrText.length}`)

        // 3. Save to DB
        const supabase = createAdminClient()
        const { data: source, error: dbError } = await supabase
            .from("student_sources")
            .insert({
                student_id: studentId,
                file_url: fileUrl,
                type: "upload",
                title: file.name,
                ocr_text: ocrText,
            })
            .select()
            .single()

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        return NextResponse.json({ data: source })
    } catch (error) {
        console.error("Upload Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
