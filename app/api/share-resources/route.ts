import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { resourceType, resourceId, studentIds, title, content } = await req.json()
        // resourceType: 'exam_result' | 'answer_key' | 'past_paper'

        // For each student, create a StudentSource entry
        // In a real app, we might use a transition table, but SRS implies adding to student_sources.

        const operations = studentIds.map((studentId: string) =>
            prisma.studentSource.create({
                data: {
                    student_id: studentId,
                    type: 'shared',
                    title: title || `Shared Resource`,
                    ocr_text: content || "",
                    // If it's a file, we should copy the URL. 
                    // Assuming the request body provides necessary data (url/content)
                    file_url: "", // Logic to handle file URL if applicable
                }
            })
        )

        await prisma.$transaction(operations)

        return NextResponse.json({ success: true, count: studentIds.length })
    } catch (error) {
        console.error('Share Error:', error)
        return NextResponse.json({ error: 'Share Failed' }, { status: 500 })
    }
}
