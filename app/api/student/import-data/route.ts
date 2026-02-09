import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { type, id, studentId, title } = await req.json()

        // Fetch the data based on type/id
        // For 'exam', we fetch the AnswerSheet + Feedback
        let content = ""

        if (type === 'exam') {
            const sheet = await prisma.answerSheet.findUnique({
                where: { id },
                include: { feedback: true }
            })

            if (sheet) {
                // Serialize relevant data for AI
                content = JSON.stringify({
                    score: sheet.total_score,
                    feedback: sheet.feedback
                }, null, 2)
            }
        }

        if (!content && type === 'exam') {
            return NextResponse.json({ error: 'Data not found' }, { status: 404 })
        }

        // Create Source
        await prisma.studentSource.create({
            data: {
                student_id: studentId,
                type: 'imported_exam',
                title: title,
                ocr_text: content,
                file_url: ""
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Import Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
