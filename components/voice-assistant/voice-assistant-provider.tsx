"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

interface VoiceAssistantContextType {
    isListening: boolean
    isProcessing: boolean
    lastResponse: string | null
    error: string | null
    startListening: () => void
    stopListening: () => void
    processCommand: (transcript: string) => Promise<void>
    registerFormSetter: (fieldName: string, setter: (value: any) => void) => void
    unregisterFormSetter: (fieldName: string) => void
    formContext: string | null
    setFormContext: (context: string | null) => void
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | null>(null)

export function useVoiceAssistant() {
    const context = useContext(VoiceAssistantContext)
    if (!context) {
        throw new Error("useVoiceAssistant must be used within VoiceAssistantProvider")
    }
    return context
}

// Hook for forms to register their fields
export function useVoiceForm(formName: string, fieldSetters: Record<string, (value: any) => void>) {
    const assistant = useVoiceAssistant()

    useEffect(() => {
        assistant.setFormContext(formName)
        Object.entries(fieldSetters).forEach(([name, setter]) => {
            assistant.registerFormSetter(name, setter)
        })

        return () => {
            assistant.setFormContext(null)
            Object.keys(fieldSetters).forEach(name => {
                assistant.unregisterFormSetter(name)
            })
        }
    }, [formName]) // eslint-disable-line react-hooks/exhaustive-deps

    return assistant
}

interface VoiceAssistantProviderProps {
    children: React.ReactNode
}

export function VoiceAssistantProvider({ children }: VoiceAssistantProviderProps) {
    const router = useRouter()
    const pathname = usePathname()

    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastResponse, setLastResponse] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [formContext, setFormContext] = useState<string | null>(null)
    const [conversationHistory, setConversationHistory] = useState<string>("")

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const formSettersRef = useRef<Map<string, (value: any) => void>>(new Map())
    const synthRef = useRef<SpeechSynthesis | null>(null)

    // Initialize speech synthesis
    useEffect(() => {
        if (typeof window !== "undefined") {
            synthRef.current = window.speechSynthesis
        }
    }, [])

    // Speak response using speech synthesis
    const speak = useCallback((text: string) => {
        if (synthRef.current && text) {
            // Cancel any ongoing speech
            synthRef.current.cancel()

            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 1.0
            utterance.pitch = 1.0
            utterance.volume = 1.0

            // Try to use a natural-sounding voice
            const voices = synthRef.current.getVoices()
            const preferredVoice = voices.find(v =>
                v.name.includes("Google") ||
                v.name.includes("Natural") ||
                v.name.includes("Samantha")
            ) || voices[0]

            if (preferredVoice) {
                utterance.voice = preferredVoice
            }

            synthRef.current.speak(utterance)
        }
    }, [])

    // Register form field setter
    const registerFormSetter = useCallback((fieldName: string, setter: (value: any) => void) => {
        formSettersRef.current.set(fieldName, setter)
    }, [])

    // Unregister form field setter
    const unregisterFormSetter = useCallback((fieldName: string) => {
        formSettersRef.current.delete(fieldName)
    }, [])

    // Process voice command through Gemini API
    const processCommand = useCallback(async (transcript: string) => {
        setIsProcessing(true)
        setError(null)

        try {
            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcript,
                    currentPath: pathname,
                    formContext,
                    conversationHistory: conversationHistory.slice(-500) // Keep last 500 chars
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || "Failed to process command")
            }

            // Update conversation history
            setConversationHistory(prev =>
                `${prev}\nUser: ${transcript}\nAssistant: ${data.response}`.slice(-1000)
            )

            // Process actions
            if (data.actions && Array.isArray(data.actions)) {
                for (const action of data.actions) {
                    switch (action.type) {
                        case "navigate":
                            if (action.path) {
                                router.push(action.path)
                                // Give time for navigation before speaking
                                await new Promise(r => setTimeout(r, 500))
                            }
                            break

                        case "fill_fields":
                            if (action.fields) {
                                Object.entries(action.fields).forEach(([fieldName, value]) => {
                                    // Try exact match first
                                    let setter = formSettersRef.current.get(fieldName)

                                    // Try case-insensitive match
                                    if (!setter) {
                                        const lowerField = fieldName.toLowerCase()
                                        for (const [key, s] of formSettersRef.current.entries()) {
                                            if (key.toLowerCase() === lowerField) {
                                                setter = s
                                                break
                                            }
                                        }
                                    }

                                    if (setter) {
                                        setter(value)
                                    }
                                })
                            }
                            break

                        case "speak":
                        case "ask_followup":
                            // Will be handled by response below
                            break
                    }
                }
            }

            // Speak the response
            if (data.response) {
                setLastResponse(data.response)
                speak(data.response)
            }

        } catch (err: any) {
            console.error("Voice assistant error:", err)
            setError(err.message)
            const errorMessage = "Sorry, I encountered an error. Please try again."
            setLastResponse(errorMessage)
            speak(errorMessage)
        } finally {
            setIsProcessing(false)
        }
    }, [pathname, formContext, conversationHistory, router, speak])

    // Start listening
    const startListening = useCallback(() => {
        if (typeof window === "undefined") return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            setError("Speech recognition not supported in this browser")
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "en-US"

        recognition.onstart = () => {
            setIsListening(true)
            setError(null)
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript
            processCommand(transcript)
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error)
            setError(event.error)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [processCommand])

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [])

    const value: VoiceAssistantContextType = {
        isListening,
        isProcessing,
        lastResponse,
        error,
        startListening,
        stopListening,
        processCommand,
        registerFormSetter,
        unregisterFormSetter,
        formContext,
        setFormContext
    }

    return (
        <VoiceAssistantContext.Provider value={value}>
            {children}
        </VoiceAssistantContext.Provider>
    )
}
