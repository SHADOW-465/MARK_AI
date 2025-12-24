import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { extractFileId, getFileMetadata, downloadFileContent } from "@/lib/google-drive"

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

        // 2. Fetch Metadata
        const metadata = await getFileMetadata(fileId, GOOGLE_API_KEY)

        // 3. Download Content
        const content = await downloadFileContent(fileId, GOOGLE_API_KEY)

        // 4. Upload to Supabase Storage
        const bucket = type === 'answer_sheet' ? 'answer-sheets' : 'study_materials'
        const fileExt = metadata.name.split('.').pop() || 'bin'
        // Use user ID as folder to avoid UUID parsing issues
        const fileName = `${user.id}/${Date.now()}-gdrive.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, content, {
                contentType: metadata.mimeType,
                upsert: false
            })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName)

        return NextResponse.json({
            success: true,
            fileId,
            fileName: metadata.name,
            mimeType: metadata.mimeType,
            size: metadata.size,
            supabaseUrl: publicUrlData.publicUrl
        })

    } catch (error: any) {
        console.error("Drive Fetch Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
