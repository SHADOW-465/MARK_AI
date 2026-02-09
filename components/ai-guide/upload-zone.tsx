"use client"

import { useState, useRef } from "react"
import { Upload, File as FileIcon, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
    studentId: string
    onUploadComplete?: () => void
}

export function UploadZone({ studentId, onUploadComplete }: UploadZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files?.[0]) {
            await uploadFile(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            await uploadFile(e.target.files[0])
        }
    }

    const uploadFile = async (file: File) => {
        setIsUploading(true)
        setStatus('idle')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('student_id', studentId)

        try {
            const res = await fetch('/api/uploads/student-sources', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            setStatus('success')
            if (onUploadComplete) onUploadComplete()
        } catch (error) {
            console.error(error)
            setStatus('error')
        } finally {
            setIsUploading(false)
            // Reset status after a delay
            setTimeout(() => setStatus('idle'), 3000)
        }
    }

    return (
        <GlassCard variant="glass" className="p-6">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300",
                    isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    isUploading && "opacity-50 pointer-events-none"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.txt,.md,.doc,.docx" // Supported types
                />

                {isUploading ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                ) : status === 'success' ? (
                    <CheckCircle className="h-10 w-10 text-emerald-500 mb-4" />
                ) : status === 'error' ? (
                    <XCircle className="h-10 w-10 text-destructive mb-4" />
                ) : (
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                )}

                <h3 className="text-lg font-bold mb-2">
                    {isUploading ? "Uploading..." : status === 'success' ? "Upload Complete" : "Upload Study Materials"}
                </h3>

                <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                    Drag & drop your notes, PDFs, or assignments here. We'll analyze them to help you study.
                </p>

                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    Select File
                </Button>
            </div>
        </GlassCard>
    )
}
