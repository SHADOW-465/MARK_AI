"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Target, Brain, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorStats {
    concept: number
    calculation: number
    keyword: number
}

interface ExamContext {
    examName: string
    subject: string
    score: number
    totalMarks: number
}

interface MasteryCheckpoint {
    topic: string
    confidence: "low" | "medium" | "high"
}

interface ContextPanelProps {
    errorStats?: ErrorStats
    examContext?: ExamContext
    masteryCheckpoints: MasteryCheckpoint[]
    onToggleMastery: (topic: string) => void
}

const ERROR_COLORS = {
    concept: "bg-purple-500",
    calculation: "bg-blue-500",
    keyword: "bg-amber-500",
}

export function ContextPanel({
    errorStats,
    examContext,
    masteryCheckpoints,
    onToggleMastery,
}: ContextPanelProps) {
    const total = errorStats
        ? Math.max(errorStats.concept + errorStats.calculation + errorStats.keyword, 1)
        : 1

    return (
        <div className="space-y-4 h-full overflow-y-auto">
            {/* Error gap proportions */}
            {errorStats && (
                <GlassCard variant="neu" className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Target size={12} />
                        Error Gaps
                    </h4>
                    {(["concept", "calculation", "keyword"] as const).map((type) => (
                        <div key={type} className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="capitalize text-muted-foreground">{type}</span>
                                <span className="font-semibold text-foreground">
                                    {Math.round((errorStats[type] / total) * 100)}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full", ERROR_COLORS[type])}
                                    style={{ width: `${(errorStats[type] / total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </GlassCard>
            )}

            {/* Exam context */}
            {examContext && (
                <GlassCard variant="neu" className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        This Exam
                    </h4>
                    <p className="text-xs text-muted-foreground">{examContext.subject}</p>
                    <p className="text-2xl font-display font-bold text-foreground my-1">
                        {Math.round((examContext.score / examContext.totalMarks) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {examContext.score}/{examContext.totalMarks} marks
                    </p>
                </GlassCard>
            )}

            {/* Mastery checklist */}
            {masteryCheckpoints.length > 0 && (
                <GlassCard variant="neu" className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Brain size={12} />
                        Mastery
                    </h4>
                    <div className="space-y-2">
                        {masteryCheckpoints.map((cp) => (
                            <button
                                key={cp.topic}
                                onClick={() => onToggleMastery(cp.topic)}
                                className="flex items-center gap-2 w-full text-left hover:opacity-75 transition-opacity"
                            >
                                {cp.confidence === "high" ? (
                                    <CheckSquare size={13} className="text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <Square size={13} className="text-muted-foreground flex-shrink-0" />
                                )}
                                <span
                                    className={cn(
                                        "text-xs",
                                        cp.confidence === "high"
                                            ? "line-through text-muted-foreground"
                                            : "text-foreground"
                                    )}
                                >
                                    {cp.topic}
                                </span>
                            </button>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    )
}
