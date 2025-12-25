"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, X, Loader2, Volume2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoiceAssistant } from "./voice-assistant-provider"
import { cn } from "@/lib/utils"

export function FloatingAssistant() {
    const {
        isListening,
        isProcessing,
        lastResponse,
        error,
        startListening,
        stopListening
    } = useVoiceAssistant()

    const [isExpanded, setIsExpanded] = useState(false)
    const [isSupported, setIsSupported] = useState(true)

    // Check browser support
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            setIsSupported(!!SpeechRecognition)
        }
    }, [])

    // Auto-expand when there's a response
    useEffect(() => {
        if (lastResponse) {
            setIsExpanded(true)
        }
    }, [lastResponse])

    // Auto-collapse after some time
    useEffect(() => {
        if (isExpanded && !isListening && !isProcessing && lastResponse) {
            const timer = setTimeout(() => {
                setIsExpanded(false)
            }, 10000) // Collapse after 10 seconds
            return () => clearTimeout(timer)
        }
    }, [isExpanded, isListening, isProcessing, lastResponse])

    const handleClick = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
            setIsExpanded(true)
        }
    }

    if (!isSupported) {
        return null // Don't show if not supported
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
            {/* Response Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="max-w-sm w-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-white">MARK AI Assistant</h3>
                                    <p className="text-[10px] text-white/50">
                                        {isListening ? "Listening..." : isProcessing ? "Thinking..." : "Click mic to speak"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                                onClick={() => setIsExpanded(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-4 min-h-[80px] max-h-[200px] overflow-y-auto">
                            {/* Listening Indicator */}
                            {isListening && (
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-full"
                                                animate={{
                                                    height: [8, 24, 8],
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.1,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-white/70">Speak now...</span>
                                </div>
                            )}

                            {/* Processing Indicator */}
                            {isProcessing && (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                                    <span className="text-sm text-white/70">Processing your request...</span>
                                </div>
                            )}

                            {/* Response */}
                            {!isListening && !isProcessing && lastResponse && (
                                <div className="flex gap-3">
                                    <Volume2 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-white/90 leading-relaxed">{lastResponse}</p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="text-sm text-red-400">
                                    Error: {error}
                                </div>
                            )}

                            {/* Idle State */}
                            {!isListening && !isProcessing && !lastResponse && !error && (
                                <p className="text-sm text-white/50 text-center">
                                    Try saying: "Go to exams" or "Create a new exam for class 10"
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                onClick={handleClick}
                disabled={isProcessing}
                className={cn(
                    "relative h-14 w-14 rounded-full shadow-lg transition-all",
                    "flex items-center justify-center",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent",
                    isListening
                        ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        : "bg-gradient-to-br from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 focus:ring-purple-500",
                    isProcessing && "opacity-80 cursor-wait"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Pulsing Ring when Listening */}
                {isListening && (
                    <>
                        <motion.span
                            className="absolute inset-0 rounded-full bg-red-500"
                            animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.span
                            className="absolute inset-0 rounded-full bg-red-500"
                            animate={{ scale: [1, 1.3, 1.3], opacity: [0.5, 0, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                        />
                    </>
                )}

                {/* Icon */}
                {isProcessing ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : isListening ? (
                    <MicOff className="h-6 w-6 text-white" />
                ) : (
                    <Mic className="h-6 w-6 text-white" />
                )}
            </motion.button>
        </div>
    )
}
