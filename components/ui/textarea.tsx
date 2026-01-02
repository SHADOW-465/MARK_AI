"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { VoiceInput } from '@/components/ui/voice-input'

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  enableVoice?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableVoice = false, value, onChange, disabled, ...props }, ref) => {
    const [interimText, setInterimText] = React.useState("")

    const handleVoiceTranscript = React.useCallback((text: string, isFinal: boolean) => {
      if (!onChange) return

      if (isFinal) {
        const currentValue = (value as string) || ''
        const newValue = currentValue ? `${currentValue} ${text}` : text
        // Create synthetic event
        const syntheticEvent = {
          target: { value: newValue.trim() }
        } as React.ChangeEvent<HTMLTextAreaElement>
        onChange(syntheticEvent)
        setInterimText("")
      } else {
        setInterimText(text)
      }
    }, [value, onChange])

    return (
      <div className="relative">
        <textarea
          ref={ref}
          data-slot="textarea"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            enableVoice && 'pr-12',
            className,
          )}
          {...props}
        />
        {enableVoice && (
          <div className="absolute right-2 top-2">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={disabled}
              className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background border border-white/10"
            />
          </div>
        )}
        {enableVoice && interimText && (
          <div className="absolute bottom-2 left-3 right-12 text-xs text-muted-foreground italic truncate pointer-events-none">
            🎙️ {interimText}...
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
