"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, X, Clock, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StreakReminderProps {
    streak: number
    lastActiveAt: string | null
}

export function StreakReminder({ streak, lastActiveAt }: StreakReminderProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [hoursLeft, setHoursLeft] = useState<number | null>(null)
    const [isCelebrating, setIsCelebrating] = useState(false)

    useEffect(() => {
        if (!lastActiveAt) {
            setIsVisible(true)
            setHoursLeft(null)
            return
        }

        const lastActive = new Date(lastActiveAt)
        const now = new Date()
        const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)
        const remaining = 24 - hoursSinceActive

        if (remaining <= 6 && remaining > 0) {
            // Show warning when 6 hours or less remaining
            setHoursLeft(Math.ceil(remaining))
            setIsVisible(true)
        } else if (remaining <= 0) {
            // Streak broken
            setIsVisible(true)
            setHoursLeft(0)
        }

        // Check for milestone celebrations
        const milestones = [7, 14, 30, 50, 100, 365]
        if (milestones.includes(streak)) {
            setIsCelebrating(true)
            setTimeout(() => setIsCelebrating(false), 5000)
        }
    }, [lastActiveAt, streak])

    if (!isVisible && !isCelebrating) return null

    return (
        <>
            {/* Streak Warning Banner */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full backdrop-blur-xl border shadow-lg ${hoursLeft === 0
                                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                                : hoursLeft && hoursLeft <= 3
                                    ? 'bg-orange-500/20 border-orange-500/30 text-orange-300'
                                    : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Flame className="w-5 h-5 animate-pulse" />
                            {hoursLeft === 0 ? (
                                <span className="font-medium">Your streak was reset! Start fresh today.</span>
                            ) : hoursLeft === null ? (
                                <span className="font-medium">Complete an activity to start your streak!</span>
                            ) : (
                                <span className="font-medium">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    {hoursLeft}h left to maintain your {streak}-day streak!
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-white/10"
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Milestone Celebration */}
            <AnimatePresence>
                {isCelebrating && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsCelebrating(false)}
                    >
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-8 text-center max-w-sm"
                        >
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5, repeat: 2 }}
                            >
                                <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                🔥 {streak} Day Streak!
                            </h2>
                            <p className="text-orange-200/80">
                                Amazing dedication! Keep up the great work.
                            </p>
                            <div className="mt-4 flex justify-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ delay: i * 0.1, repeat: Infinity, duration: 0.5 }}
                                        className="text-2xl"
                                    >
                                        🔥
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
