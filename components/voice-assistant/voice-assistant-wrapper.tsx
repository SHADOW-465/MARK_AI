"use client"

import { VoiceAssistantProvider, FloatingAssistant } from "@/components/voice-assistant"

export function VoiceAssistantWrapper({ children }: { children: React.ReactNode }) {
    return (
        <VoiceAssistantProvider>
            {children}
            <FloatingAssistant />
        </VoiceAssistantProvider>
    )
}
