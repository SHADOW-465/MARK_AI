"use client"

import { useState } from "react"
import { Sparkles, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Assuming "sonner" is available as it was in package.json

interface AddToGuideButtonProps {
    examId: string
    examName: string
    studentId: string
}

export function AddToGuideButton({ examId, examName, studentId }: AddToGuideButtonProps) {
    const [loading, setLoading] = useState(false)
    const [added, setAdded] = useState(false)

    const handleAddToGuide = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation if inside a Link
        e.stopPropagation()

        setLoading(true)
        try {
            const res = await fetch('/api/student/import-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'exam',
                    id: examId,
                    studentId,
                    title: `Exam Review: ${examName}`
                })
            })

            if (!res.ok) throw new Error("Import failed")

            setAdded(true)
            toast.success("Added to AI Guide", {
                description: "You can now generate study aids from this exam."
            })
        } catch (error) {
            toast.error("Failed to add")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/10"
            onClick={handleAddToGuide}
            disabled={loading || added}
            aria-label="Add to AI Guide"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> :
                added ? <Check size={14} /> :
                    <Sparkles size={14} />}
        </Button>
    )
}
