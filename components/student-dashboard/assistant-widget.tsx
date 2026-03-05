import { Send } from "lucide-react"
import Link from "next/link"

export function AssistantWidget() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <h3 className="mb-3 text-xl font-semibold text-foreground">AI assistant</h3>
      <p className="mb-4 text-sm text-muted-foreground">Ask for study tips, summaries, and exam prep support.</p>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <input className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Ask something..." />
        <Link href="/student/ai-guide" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          <Send size={14} />
        </Link>
      </div>
    </div>
  )
}
