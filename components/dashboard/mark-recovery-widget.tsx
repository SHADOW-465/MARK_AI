"use client"

import { useRouter } from "next/navigation"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { Target } from "lucide-react"

interface RecoveryStats { concept: number; calculation: number; keyword: number }

const COLORS = { concept: "#8b5cf6", calculation: "#3b82f6", keyword: "#f59e0b" }

export function MarkRecoveryWidget({
    stats,
    studentId,
}: {
    stats: RecoveryStats
    studentId: string
}) {
    const router = useRouter()
    const total = Math.max(stats.concept + stats.calculation + stats.keyword, 1)
    const data = (["concept", "calculation", "keyword"] as const)
        .filter((k) => stats[k] > 0)
        .map((k) => ({ name: k, value: stats[k], color: COLORS[k] }))

    const handleClick = async (entry: { name: string }) => {
        const res = await fetch("/api/ai-guide/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentId,
                sessionType: "concept_study",
                errorFocus: entry.name,
                title: `${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)} Error Recovery`,
            }),
        })
        const { session } = await res.json()
        router.push(`/student/ai-guide/${session.id}`)
    }

    if (total === 1) {
        return (
            <GlassCard variant="neu" className="p-6">
                <h3 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <Target className="text-indigo-500" size={20} /> Mark Recovery
                </h3>
                <p className="text-sm text-muted-foreground">Complete an exam to see your error gaps.</p>
            </GlassCard>
        )
    }

    return (
        <GlassCard variant="neu" className="p-6">
            <h3 className="text-lg font-display font-bold text-foreground mb-1 flex items-center gap-2">
                <Target className="text-indigo-500" size={20} /> Mark Recovery
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Tap a segment to study that error type</p>
            <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                        paddingAngle={3} dataKey="value" onClick={handleClick} className="cursor-pointer">
                        {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${Math.round((v / total) * 100)}%`]} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
                {data.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-muted-foreground capitalize">
                            {d.name}: {Math.round((d.value / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}
