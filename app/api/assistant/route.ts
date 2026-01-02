import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Define all available routes and their purposes
const APP_ROUTES = {
    "/dashboard": "Teacher dashboard home",
    "/dashboard/exams": "View all exams",
    "/dashboard/exams/create": "Create a new exam",
    "/dashboard/students": "View all students",
    "/dashboard/students/add": "Add a new student",
    "/dashboard/grading": "View grading queue",
    "/dashboard/messages": "View messages",
    "/dashboard/settings": "Settings page",
    "/student/dashboard": "Student dashboard home",
    "/student/performance": "Student performance/grades",
    "/student/analytics": "Student analytics",
    "/student/flashcards": "Flashcards for studying",
    "/student/planner": "Task planner",
    "/student/vault": "Study materials vault",
    "/student/study": "Deep work studio",
    "/auth/sign-up": "Sign up page",
    "/": "Landing page / Login"
}

// Define forms and their fields across the app
const FORM_FIELDS = {
    "exam_creation": {
        path: "/dashboard/exams/create",
        fields: {
            examName: { type: "text", description: "Name of the exam" },
            subject: { type: "text", description: "Subject (e.g., Physics, Math)" },
            className: { type: "text", description: "Class (e.g., 10-A, 12th Grade)" },
            totalMarks: { type: "number", description: "Total marks for the exam" },
            examDate: { type: "date", description: "Date of the exam" },
            passingPercentage: { type: "number", description: "Passing percentage (default 35)" }
        }
    },
    "student_add": {
        path: "/dashboard/students/add",
        fields: {
            name: { type: "text", description: "Student's full name" },
            rollNumber: { type: "text", description: "Roll number" },
            class: { type: "text", description: "Class (e.g., 10-A)" },
            section: { type: "text", description: "Section (optional)" },
            email: { type: "email", description: "Email address (optional)" }
        }
    },
    "login": {
        path: "/",
        fields: {
            email: { type: "email", description: "Email for login" },
            password: { type: "password", description: "Password" }
        }
    },
    "signup": {
        path: "/auth/sign-up",
        fields: {
            email: { type: "email", description: "Email for signup" },
            password: { type: "password", description: "Password" },
            name: { type: "text", description: "Full name" },
            rollNumber: { type: "text", description: "Roll number (for students)" },
            class: { type: "text", description: "Class (for students)" }
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { transcript, currentPath, formContext, conversationHistory } = await request.json()

        if (!transcript) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 })
        }

        const systemPrompt = `You are MARK AI's intelligent voice assistant. Your job is to understand user voice commands and convert them into actions.

AVAILABLE ROUTES:
${JSON.stringify(APP_ROUTES, null, 2)}

AVAILABLE FORMS AND THEIR FIELDS:
${JSON.stringify(FORM_FIELDS, null, 2)}

CURRENT CONTEXT:
- User is currently on: ${currentPath}
- Current form context: ${formContext ? JSON.stringify(formContext) : "None"}

USER'S COMMAND: "${transcript}"

${conversationHistory ? `PREVIOUS CONVERSATION:\n${conversationHistory}` : ""}

INSTRUCTIONS:
1. Understand what the user wants to do
2. If they want to navigate somewhere, provide a "navigate" action
3. If they want to fill form fields, provide a "fill_fields" action with field values
4. If critical information is missing for a form action, ask a SINGLE follow-up question
5. Always be helpful and conversational

RESPOND WITH VALID JSON ONLY in this exact format:
{
    "understood": true,
    "actions": [
        {
            "type": "navigate" | "fill_fields" | "speak" | "ask_followup",
            "path": "/path/to/page",
            "fields": { "fieldName": "value" },
            "message": "What I understood or follow-up question"
        }
    ],
    "response": "Natural language response to speak to the user",
    "missingFields": ["fieldName1", "fieldName2"]
}`

        const { text: responseText } = await generateText({
            model: google("gemini-2.0-flash"),
            prompt: systemPrompt
        })

        // Extract JSON from response
        let parsed
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0])
            } else {
                throw new Error("No JSON found")
            }
        } catch (e) {
            parsed = {
                understood: true,
                actions: [{ type: "speak", message: responseText }],
                response: responseText
            }
        }

        return NextResponse.json({
            success: true,
            ...parsed
        })

    } catch (error: any) {
        console.error("Assistant API error:", error)
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to process command",
            response: "Sorry, I couldn't understand that. Could you please try again?"
        }, { status: 500 })
    }
}
