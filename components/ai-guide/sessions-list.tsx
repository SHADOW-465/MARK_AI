"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import {
    Brain, Plus, BookOpen, FlaskConical, FileText, Clock, Loader2, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Session {
    id: string
    title: string
    session_type: string
    error_focus: string | null
    last_active_at: string
}

const TYPE_ICON = {
    exam_prep: FlaskConical,
    concept_study: Brain,
    note_synthesis: FileText,
    free_study: BookOpen,
} as const

const TYPE_LABEL = {
    exam_prep: "Exam Debrief",
    concept_study: "Concept Study",
    note_synthesis: "Note Synthesis",
    free_study: "Free Study",
} as const

const ERROR_FOCUS_STYLE = {
    concept: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    calculation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    keyword: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
} as const

export function SessionsList({
    initialSessions,
    studentId,
}: {
    initialSessions: Session[]
    studentId: string
}) {
    const router = useRouter()
    const [sessions, setSessions] = useState(initialSessions)
    const [creating, setCreating] = useState(false)

    const createSession = async () => {
        setCreating(true)
        try {
            const res = await fetch("/api/ai-guide/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, sessionType: "free_study" }),
            })
            const { session } = await res.json()
            router.push(`/student/ai-guide/${session.id}`)
        } catch {
            setCreating(false)
        }
    }

    const deleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        await fetch(`/api/ai-guide/sessions/${id}`, { method: "DELETE" })
        setSessions((prev) => prev.filter((s) => s.id !== id))
    }

    return (
        <div className="space-y-6">
            <Button
                variant="liquid"
                className="w-full py-6 text-base gap-2"
                onClick={createSession}
                disabled={creating}
            >
                {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                New Study Session
            </Button>

            {sessions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
                    <Brain size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No sessions yet.</p>
                    <p className="text-sm mt-1">Start a new session or click "Study This" on any exam.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.map((session) => {
                        const Icon = TYPE_ICON[session.session_type as keyof typeof TYPE_ICON] ?? BookOpen
                        return (
                            <GlassCard
                                key={session.id}
                                hoverEffect
                                className="p-5 cursor-pointer group relative"
                                onClick={() => router.push(`/student/ai-guide/${session.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                        <Icon size={16} />
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                <h3 className="font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                    {session.title}
                                </h3>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground bg-secondary/70 px-2 py-0.5 rounded-full">
                                        {TYPE_LABEL[session.session_type as keyof typeof TYPE_LABEL] ?? "Study"}
                                    </span>
                                    {session.error_focus && (
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-medium",
                                            ERROR_FOCUS_STYLE[session.error_focus as keyof typeof ERROR_FOCUS_STYLE]
                                        )}>
                                            {session.error_focus} focus
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </GlassCard>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
