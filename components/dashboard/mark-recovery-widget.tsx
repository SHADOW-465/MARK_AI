"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { AlertTriangle, ArrowRight, Activity } from "lucide-react"
import Link from "next/link"

interface MarkRecoveryProps {
    concept: number
    calculation: number
    keyword: number
}

export function MarkRecoveryWidget({ stats }: { stats: MarkRecoveryProps }) {
    const totalLost = stats.concept + stats.calculation + stats.keyword

    if (totalLost === 0) return null

    return (
        <GlassCard className="h-full p-6 flex flex-col relative overflow-hidden border-red-500/20">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 p-32 bg-red-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
                <Activity size={20} />
                Mark Recovery
            </h3>

            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="text-sm text-foreground/80">Total Recoverable</span>
                    <span className="text-xl font-bold font-display text-red-400">-{totalLost}</span>
                </div>

                <div className="space-y-2">
                    {stats.concept > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Concept Gaps</span>
                            <span className="text-red-300">-{stats.concept}</span>
                        </div>
                    )}
                    {stats.calculation > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Calculation Errors</span>
                            <span className="text-amber-300">-{stats.calculation}</span>
                        </div>
                    )}
                    {stats.keyword > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Keywords Missed</span>
                            <span className="text-blue-300">-{stats.keyword}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
                <Link href="/student/performance" className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors group">
                    <span className="text-sm font-bold text-red-400">Reclaim Marks</span>
                    <ArrowRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </GlassCard>
    )
}
