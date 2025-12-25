"use client"

import { useState, useCallback, forwardRef } from "react"
import { Textarea, TextareaProps } from "@/components/ui/textarea"
import { Input, InputProps } from "@/components/ui/input"
import { VoiceInput } from "@/components/ui/voice-input"
import { cn } from "@/lib/utils"

interface VoiceTextareaProps extends Omit<TextareaProps, 'onChange'> {
    value: string
    onChange: (value: string) => void
    showVoiceButton?: boolean
}

export const VoiceTextarea = forwardRef<HTMLTextAreaElement, VoiceTextareaProps>(
    ({ value, onChange, showVoiceButton = true, className, disabled, ...props }, ref) => {
        const [interimText, setInterimText] = useState("")

        const handleTranscript = useCallback((text: string, isFinal: boolean) => {
            if (isFinal) {
                // Append final transcript to value
                const newValue = value ? `${value} ${text}` : text
                onChange(newValue.trim())
                setInterimText("")
            } else {
                // Show interim results as preview
                setInterimText(text)
            }
        }, [value, onChange])

        return (
            <div className="relative">
                <Textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={cn("pr-12", className)}
                    {...props}
                />
                {showVoiceButton && (
                    <div className="absolute right-2 top-2">
                        <VoiceInput
                            onTranscript={handleTranscript}
                            disabled={disabled}
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                        />
                    </div>
                )}
                {interimText && (
                    <div className="absolute bottom-2 left-3 right-12 text-xs text-muted-foreground italic truncate">
                        {interimText}...
                    </div>
                )}
            </div>
        )
    }
)
VoiceTextarea.displayName = "VoiceTextarea"

interface VoiceInputFieldProps extends Omit<InputProps, 'onChange'> {
    value: string
    onChange: (value: string) => void
    showVoiceButton?: boolean
}

export const VoiceInputField = forwardRef<HTMLInputElement, VoiceInputFieldProps>(
    ({ value, onChange, showVoiceButton = true, className, disabled, ...props }, ref) => {
        const handleTranscript = useCallback((text: string, isFinal: boolean) => {
            if (isFinal) {
                const newValue = value ? `${value} ${text}` : text
                onChange(newValue.trim())
            }
        }, [value, onChange])

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={cn("pr-10", className)}
                    {...props}
                />
                {showVoiceButton && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <VoiceInput
                            onTranscript={handleTranscript}
                            disabled={disabled}
                            className="h-7 w-7 bg-transparent hover:bg-muted/50"
                        />
                    </div>
                )}
            </div>
        )
    }
)
VoiceInputField.displayName = "VoiceInputField"
