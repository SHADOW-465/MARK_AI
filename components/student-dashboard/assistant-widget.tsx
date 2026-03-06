"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2 } from "lucide-react"

export function AssistantWidget({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/ai-guide/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionType: "free_study",
          title: message.trim().slice(0, 60),
        }),
      })
      if (res.ok) {
        const { session } = await res.json()
        router.push(`/student/ai-guide/${session.id}`)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <h3 className="mb-3 text-xl font-semibold text-foreground">AI assistant</h3>
      <p className="mb-4 text-sm text-muted-foreground">Ask for study tips, summaries, and exam prep support.</p>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <input
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Ask something..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || loading}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
