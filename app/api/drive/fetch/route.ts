import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { extractFileId, getFileMetadata, getPreviewUrl, downloadFileContent } from "@/lib/google-drive"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

export async function POST(req: Request) {
    try {
        if (!GOOGLE_API_KEY) {
            return new NextResponse("Google API key not configured", { status: 500 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { driveUrl, type } = await req.json()
        // type: 'answer_sheet' | 'study_material'

        // 1. Extract File ID
        const fileId = extractFileId(driveUrl)
        if (!fileId) {
            return NextResponse.json({ error: "Invalid Google Drive URL" }, { status: 400 })
        }

        // 2. Fetch Metadata (to validate the file exists and get its name)
        const metadata = await getFileMetadata(fileId, GOOGLE_API_KEY)
        const fileExt = metadata.name.split('.').pop() || 'bin'

        // For ANSWER SHEETS: Download and re-upload to Supabase (Gemini needs direct image access)
        // For STUDY MATERIALS: Just store the link (text content, not AI graded)

        if (type === 'answer_sheet') {
            // Download the file from Drive
            const content = await downloadFileContent(fileId, GOOGLE_API_KEY)

            // Upload to Supabase Storage
            const fileName = `${user.id}/${Date.now()}-gdrive.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('answer-sheets')
                .upload(fileName, content, {
                    contentType: metadata.mimeType,
                    upsert: false
                })

            if (uploadError) {
                console.error("Storage upload error:", uploadError)
                return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
            }

            const { data: publicUrlData } = supabase.storage.from('answer-sheets').getPublicUrl(fileName)

            return NextResponse.json({
                success: true,
                fileId,
                fileName: metadata.name,
                mimeType: metadata.mimeType,
                size: metadata.size,
                supabaseUrl: publicUrlData.publicUrl
            })
        } else {
            // Study materials - just store the preview link (no AI grading needed)
            const previewUrl = getPreviewUrl(fileId)

            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (studentError) {
                console.error('Student lookup error:', studentError)
                return NextResponse.json({ error: "Failed to verify student record" }, { status: 500 })
            }

            if (!student) {
                return NextResponse.json({ error: "Student profile not found. Please complete onboarding." }, { status: 404 })
            }

            const { error: dbError } = await supabase.from('study_materials').insert({
                student_id: student.id,
                title: metadata.name,
                file_url: previewUrl,
                file_type: fileExt,
                extracted_text: `[Google Drive Content: ${metadata.name}]`
            })

            if (dbError) {
                console.error('DB insert error:', dbError)
                return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                fileId,
                fileName: metadata.name,
                mimeType: metadata.mimeType,
                size: metadata.size,
                drivePreviewUrl: previewUrl,
                supabaseUrl: previewUrl
            })
        }

    } catch (error: any) {
        console.error("Drive Fetch Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
