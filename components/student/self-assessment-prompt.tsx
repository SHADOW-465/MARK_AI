"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelfAssessmentPromptProps {
    examId: string
    examName: string
    studentId: string
    subject: string
}

const TOPICS_BY_DEFAULT = ["Key Concepts", "Problem Solving", "Formulae / Definitions"]

export function SelfAssessmentPrompt({
    examId,
    examName,
    studentId,
    subject,
}: SelfAssessmentPromptProps) {
    const topics = [subject, ...TOPICS_BY_DEFAULT].slice(0, 3)
    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [done, setDone] = useState(false)

    const allRated = topics.every((t) => ratings[t])

    const submit = async () => {
        if (!allRated) return
        await fetch("/api/student/self-assessment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentId,
                examId,
                topics: topics.map((t) => ({ name: t, confidence: ratings[t] })),
            }),
        })
        setDone(true)
    }

    if (done) {
        return (
            <GlassCard variant="neu" className="p-4 flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">
                    Saved! We&apos;ll compare this to your actual result after grading.
                </p>
            </GlassCard>
        )
    }

    return (
        <GlassCard variant="neu" className="p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex-shrink-0">
                    <Brain size={15} />
                </div>
                <div>
                    <p className="font-bold text-foreground text-sm">{examName} — Coming Up</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Rate your confidence (1–5)</p>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {topics.map((topic) => (
                    <div key={topic} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-foreground flex-1 min-w-0 truncate">{topic}</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setRatings((p) => ({ ...p, [topic]: n }))}
                                    className={cn(
                                        "w-6 h-6 rounded-lg text-xs font-bold transition-all",
                                        ratings[topic] === n
                                            ? "bg-indigo-500 text-white"
                                            : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                                    )}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Button variant="liquid" size="sm" className="w-full" onClick={submit} disabled={!allRated}>
                Save Assessment
            </Button>
        </GlassCard>
    )
}
