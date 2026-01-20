"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Flame, Zap, FileText, Target, Award } from "lucide-react"

interface AnalyticsChartsProps {
    xpData: Array<{ date: string; xp: number; totalXp: number }>
    examScoreData: Array<{ name: string; score: number; total: number; percentage: number; subject: string; date?: string }>
    subjectData: Array<{ subject: string; avgScore: number; examsCount: number }>
    currentStats: {
        xp: number
        streak: number
        level: number
        totalExams: number
    }
}

const COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#3b82f6']

export function AnalyticsCharts({ xpData, examScoreData, subjectData, currentStats }: AnalyticsChartsProps) {
    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Zap className="text-yellow-400" />}
                    label="Total XP"
                    value={currentStats.xp.toLocaleString()}
                    bgColor="bg-yellow-500/10"
                    borderColor="border-yellow-500/20"
                />
                <StatCard
                    icon={<Flame className="text-orange-400" />}
                    label="Streak"
                    value={`${currentStats.streak} days`}
                    bgColor="bg-orange-500/10"
                    borderColor="border-orange-500/20"
                />
                <StatCard
                    icon={<Award className="text-purple-400" />}
                    label="Level"
                    value={currentStats.level.toString()}
                    bgColor="bg-purple-500/10"
                    borderColor="border-purple-500/20"
                />
                <StatCard
                    icon={<FileText className="text-cyan-400" />}
                    label="Exams Graded"
                    value={currentStats.totalExams.toString()}
                    bgColor="bg-cyan-500/10"
                    borderColor="border-cyan-500/20"
                />
            </div>

            {/* XP Progress Chart */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-cyan-500" size={20} />
                    XP Progress Over Time
                </h3>
                {xpData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={xpData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" className="stroke-muted-foreground" fontSize={12} />
                            <YAxis className="stroke-muted-foreground" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="totalXp"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                dot={{ fill: '#06b6d4', strokeWidth: 2 }}
                                name="Total XP"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No XP data yet. Complete activities to see your progress!
                    </div>
                )}
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Exam Scores Chart */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Target className="text-purple-500" size={20} />
                        Exam Score Trends
                    </h3>
                    {examScoreData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={examScoreData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="name" className="stroke-muted-foreground" fontSize={12} />
                                <YAxis className="stroke-muted-foreground" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                    formatter={(value: number) => [`${value}%`, 'Score']}
                                />
                                <Bar dataKey="percentage" fill="#a855f7" radius={[4, 4, 0, 0]} name="Score %" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            No graded exams yet.
                        </div>
                    )}
                </GlassCard>

                {/* Subject Performance */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-4">Subject Performance</h3>
                    {subjectData.length > 0 ? (
                        <div className="space-y-4">
                            {subjectData.map((subject, index) => (
                                <div key={subject.subject} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{subject.subject}</span>
                                        <span className="text-muted-foreground">
                                            {subject.avgScore}% avg ({subject.examsCount} exams)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${subject.avgScore}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            Complete exams to see subject breakdown.
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, bgColor, borderColor }: { icon: React.ReactNode; label: string; value: string; bgColor: string; borderColor: string }) {
    return (
        <GlassCard className={`p-4 ${borderColor}`}>
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-xl font-bold font-display text-foreground">{value}</p>
                </div>
            </div>
        </GlassCard>
    )
}
