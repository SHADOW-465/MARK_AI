"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, Plus, Loader2, ArrowRight, Clock } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

interface GuideSession {
  id: string
  title: string
  session_type: string
  last_active_at: string
}

interface SubjectAiGuidePanelProps {
  subjectId: string
  studentId: string
  subjectName: string
  guideSessions: GuideSession[]
}

export function SubjectAiGuidePanel({ subjectId, studentId, subjectName, guideSessions }: SubjectAiGuidePanelProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const handleNewSession = async () => {
    setCreating(true)
    const res = await fetch("/api/ai-guide/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        sessionType: "free_study",
        title: `${subjectName} — Study`,
        subjectId,
      }),
    })
    if (res.ok) {
      const { session } = await res.json()
      router.push(`/student/ai-guide/${session.id}`)
    } else {
      setCreating(false)
    }
  }

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain size={16} className="text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">AI Guide</h3>
        </div>
        <Button
          size="sm"
          onClick={handleNewSession}
          disabled={creating}
          className="gap-1.5"
        >
          {creating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          New session
        </Button>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Chat with your AI study guide about {subjectName}. It knows your exam history and can help you practice weak spots.
      </p>

      {guideSessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Brain size={24} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">No sessions yet for this subject.</p>
          <Button onClick={handleNewSession} disabled={creating} variant="outline" size="sm">
            {creating ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null}
            Start studying {subjectName}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {guideSessions.map((s) => (
            <a
              key={s.id}
              href={`/student/ai-guide/${s.id}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock size={9} />
                  {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                </p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
