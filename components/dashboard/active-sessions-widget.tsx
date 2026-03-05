import { GlassCard } from "@/components/ui/glass-card"
import { Brain, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Session {
    id: string
    title: string
    last_active_at: Date | string
}

export function ActiveSessionsWidget({ sessions }: { sessions: Session[] }) {
    if (sessions.length === 0) return null

    return (
        <GlassCard variant="neu" className="p-6">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Brain className="text-indigo-500" size={20} />
                Resume Studying
            </h3>
            <div className="space-y-2">
                {sessions.slice(0, 3).map((s) => (
                    <Link key={s.id} href={`/student/ai-guide/${s.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border hover:bg-secondary transition-all group">
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
                        </div>
                    </Link>
                ))}
            </div>
            {sessions.length > 3 && (
                <Link href="/student/ai-guide" className="block text-center text-xs text-primary font-medium mt-3 hover:underline">
                    View all {sessions.length} sessions →
                </Link>
            )}
        </GlassCard>
    )
}
