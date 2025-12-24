import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { extractFileId, getFileMetadata, getPreviewUrl } from "@/lib/google-drive"

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

        // 3. Generate direct Drive URLs (NO download/upload to Supabase)
        const previewUrl = getPreviewUrl(fileId)
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        const fileExt = metadata.name.split('.').pop() || 'bin'

        // 4. If study_material, insert a database record with Drive URL
        if (type === 'study_material') {
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (student) {
                const { error: dbError } = await supabase.from('study_materials').insert({
                    student_id: student.id,
                    title: metadata.name,
                    file_url: previewUrl, // Store Drive preview URL directly
                    file_type: fileExt,
                    extracted_text: '[Google Drive link - content accessed on-demand]'
                })

                if (dbError) {
                    console.error('DB insert error:', dbError)
                }
            }
        }

        // Return the Drive URLs for the client to use
        return NextResponse.json({
            success: true,
            fileId,
            fileName: metadata.name,
            mimeType: metadata.mimeType,
            size: metadata.size,
            // Return Drive URLs instead of Supabase URL
            drivePreviewUrl: previewUrl,
            driveDownloadUrl: downloadUrl,
            // For backwards compatibility with answer sheet flow
            supabaseUrl: previewUrl
        })

    } catch (error: any) {
        console.error("Drive Fetch Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
