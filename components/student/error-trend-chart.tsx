"use client"

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { TrendingUp } from "lucide-react"

interface ErrorDataPoint {
    examName: string
    concept: number
    calculation: number
    keyword: number
}

export function ErrorTrendChart({ data }: { data: ErrorDataPoint[] }) {
    if (data.length < 2) {
        return (
            <GlassCard variant="neu" className="p-6">
                <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-indigo-500" /> Error Trend
                </h3>
                <p className="text-sm text-muted-foreground">
                    Need at least 2 graded exams to show error trends.
                </p>
            </GlassCard>
        )
    }

    return (
        <GlassCard variant="neu" className="p-6">
            <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-1">
                <TrendingUp size={20} className="text-indigo-500" /> Error Trend Over Time
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
                Falling lines = you&apos;re improving that error type.
            </p>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                        {(["concept", "calculation", "keyword"] as const).map((k, i) => {
                            const c = ["#8b5cf6", "#3b82f6", "#f59e0b"][i]
                            return (
                                <linearGradient key={k} id={k} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                                </linearGradient>
                            )
                        })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="examName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Area type="monotone" dataKey="concept" name="Concept" stroke="#8b5cf6" fill="url(#concept)" strokeWidth={2} />
                    <Area type="monotone" dataKey="calculation" name="Calculation" stroke="#3b82f6" fill="url(#calculation)" strokeWidth={2} />
                    <Area type="monotone" dataKey="keyword" name="Keyword" stroke="#f59e0b" fill="url(#keyword)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </GlassCard>
    )
}
