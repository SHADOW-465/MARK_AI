import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// We need a Service Role client to process uploads broadly if needed, 
// but for student uploads, we can usage the standard client. 
// However, the SRS says "backend support for uploads ... to Supabase storage".
// We'll use the authenticated user's client if possible, or a server admin client.
// Assuming we have env vars.

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const studentId = formData.get('student_id') as string

        if (!file || !studentId) {
            return NextResponse.json({ error: 'Missing file or student_id' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${studentId}/${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('student_sources') // Assuming this bucket exists or will be created
            .upload(fileName, file)

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_sources/${fileName}`

        // 2. Perform OCR (Simulated or via Gemini Vision if text/image)
        // For now, we'll placeholder OCR. In a real scenario, we'd send to Gemini/Google Cloud Vision.
        // If it's a PDF/Image, we can use Gemini 2.5 Flash which accepts files/images.
        let ocrText = ""

        // 3. Save to DB
        const source = await prisma.studentSource.create({
            data: {
                student_id: studentId,
                file_url: fileUrl,
                type: 'upload',
                title: file.name,
                ocr_text: ocrText
            }
        })

        return NextResponse.json({ data: source })
    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
