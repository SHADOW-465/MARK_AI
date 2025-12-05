"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export interface AnalyticsChartProps {
    data: {
        name: string
        average: number
        passing: number
    }[]
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-slate-500">
                <p>No exam data available yet</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar dataKey="average" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Class Average" />
                    <Bar dataKey="passing" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Passing Rate" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
