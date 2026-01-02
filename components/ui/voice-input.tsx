"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
    onTranscript: (text: string, isFinal: boolean) => void
    disabled?: boolean
    className?: string
    size?: "sm" | "default" | "lg" | "icon"
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition
        webkitSpeechRecognition: typeof SpeechRecognition
    }
}

export function VoiceInput({ onTranscript, disabled, className, size = "icon" }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const recognitionRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            setIsSupported(false)
            return
        }

        // Initialize recognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event) => {
            let interimTranscript = ""
            let finalTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                } else {
                    interimTranscript += transcript
                }
            }

            if (finalTranscript) {
                onTranscript(finalTranscript, true)
            } else if (interimTranscript) {
                onTranscript(interimTranscript, false)
            }
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error)
            if (event.error === "not-allowed") {
                setIsSupported(false)
            }
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            recognition.abort()
        }
    }, [onTranscript])

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (e) {
                console.error("Failed to start recognition:", e)
            }
        }
    }, [isListening])

    if (!isSupported) {
        return null // Don't show button if not supported
    }

    return (
        <Button
            type="button"
            variant={isListening ? "destructive" : "ghost"}
            size={size}
            onClick={toggleListening}
            disabled={disabled}
            className={cn(
                "transition-all",
                isListening && "animate-pulse ring-2 ring-red-500/50",
                className
            )}
            title={isListening ? "Stop listening" : "Start voice input"}
        >
            {isListening ? (
                <MicOff className="h-4 w-4" />
            ) : (
                <Mic className="h-4 w-4" />
            )}
        </Button>
    )
}

// Hook for easier integration
export function useVoiceInput() {
    const [transcript, setTranscript] = useState("")
    const [isListening, setIsListening] = useState(false)

    const handleTranscript = useCallback((text: string, isFinal: boolean) => {
        if (isFinal) {
            setTranscript(prev => prev + " " + text)
        }
    }, [])

    const clearTranscript = useCallback(() => {
        setTranscript("")
    }, [])

    return {
        transcript,
        isListening,
        handleTranscript,
        clearTranscript,
        setTranscript
    }
}
