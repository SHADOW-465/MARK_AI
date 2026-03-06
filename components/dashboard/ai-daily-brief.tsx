"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

export function AiDailyBrief({ studentId }: { studentId: string }) {
    const [brief, setBrief] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/ai-guide/daily-brief?studentId=${studentId}`)
            .then((r) => r.json())
            .then((d) => { setBrief(d.brief); setLoading(false) })
            .catch(() => setLoading(false))
    }, [studentId])

    if (!loading && !brief) return null

    return (
        <div className="rounded-2xl p-5 flex items-start gap-3" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
            <div className="p-2 rounded-xl bg-white/20 flex-shrink-0">
                {loading
                    ? <Loader2 size={15} className="text-white animate-spin" />
                    : <Sparkles size={15} className="text-white" />
                }
            </div>
            <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Today&apos;s Focus</p>
                {loading
                    ? <div className="h-4 w-56 bg-white/20 rounded animate-pulse" />
                    : <p className="text-white text-sm font-medium leading-relaxed">{brief}</p>
                }
            </div>
        </div>
    )
}
