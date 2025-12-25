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
                    color="yellow"
                />
                <StatCard
                    icon={<Flame className="text-orange-400" />}
                    label="Streak"
                    value={`${currentStats.streak} days`}
                    color="orange"
                />
                <StatCard
                    icon={<Award className="text-purple-400" />}
                    label="Level"
                    value={currentStats.level.toString()}
                    color="purple"
                />
                <StatCard
                    icon={<FileText className="text-cyan-400" />}
                    label="Exams Graded"
                    value={currentStats.totalExams.toString()}
                    color="cyan"
                />
            </div>

            {/* XP Progress Chart */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-neon-cyan" size={20} />
                    XP Progress Over Time
                </h3>
                {xpData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={xpData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
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
                        <Target className="text-neon-purple" size={20} />
                        Exam Score Trends
                    </h3>
                    {examScoreData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={examScoreData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
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
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <GlassCard className={`p-4 border-${color}-500/20`}>
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-xl font-bold font-display">{value}</p>
                </div>
            </div>
        </GlassCard>
    )
}
