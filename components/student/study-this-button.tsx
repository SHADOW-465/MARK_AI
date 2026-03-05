"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface StudyThisButtonProps {
    examId: string       // AnswerSheet id (not Exam id)
    examName: string
    studentId: string
    variant?: "icon" | "full"
}

export function StudyThisButton({
    examId,
    examName,
    studentId,
    variant = "icon",
}: StudyThisButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation() // prevent parent <Link> from firing
        setLoading(true)

        try {
            const res = await fetch("/api/ai-guide/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    sessionType: "exam_prep",
                    examContextId: examId,
                    title: `${examName} — Debrief`,
                }),
            })

            if (!res.ok) throw new Error("Failed to create session")
            const { session } = await res.json()
            router.push(`/student/ai-guide/${session.id}`)
        } catch (err) {
            console.error("[study-this]", err)
            setLoading(false)
        }
    }

    if (variant === "full") {
        return (
            <Button
                variant="liquid"
                size="sm"
                onClick={handleClick}
                disabled={loading}
                className="gap-2"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Study This
            </Button>
        )
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            title={`Study ${examName} with AI Guide`}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50 transition-colors"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Study This
        </button>
    )
}
