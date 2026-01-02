"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { UploadCloud, Link2, Loader2, CheckCircle, X, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Student {
    id: string
    name: string
    roll_number: string
}

interface BatchUploadDialogProps {
    examId: string
    students: Student[]
    isOpen: boolean
    onClose: () => void
}

interface UploadItem {
    studentId: string
    studentName: string
    status: 'pending' | 'uploading' | 'success' | 'error'
    file?: File
    driveUrl?: string
    error?: string
}

export function BatchUploadDialog({ examId, students, isOpen, onClose }: BatchUploadDialogProps) {
    const router = useRouter()
    const [uploadMode, setUploadMode] = useState<'file' | 'drive'>('file')
    const [uploadItems, setUploadItems] = useState<UploadItem[]>(
        students.map(s => ({ studentId: s.id, studentName: s.name, status: 'pending' }))
    )
    const [isProcessing, setIsProcessing] = useState(false)
    const [driveLinks, setDriveLinks] = useState<Record<string, string>>({})

    const handleFileSelect = (studentId: string, file: File) => {
        setUploadItems(prev => prev.map(item =>
            item.studentId === studentId
                ? { ...item, file, status: 'pending' }
                : item
        ))
    }

    const handleDriveLinkChange = (studentId: string, url: string) => {
        setDriveLinks(prev => ({ ...prev, [studentId]: url }))
    }

    const handleBatchUpload = async () => {
        setIsProcessing(true)
        const supabase = createClient()

        for (const item of uploadItems) {
            // Update status to uploading
            setUploadItems(prev => prev.map(i =>
                i.studentId === item.studentId ? { ...i, status: 'uploading' } : i
            ))

            try {
                let fileUrl: string

                if (uploadMode === 'drive') {
                    const driveUrl = driveLinks[item.studentId]
                    if (!driveUrl) {
                        setUploadItems(prev => prev.map(i =>
                            i.studentId === item.studentId
                                ? { ...i, status: 'error', error: 'No Drive link provided' }
                                : i
                        ))
                        continue
                    }

                    // Fetch from Drive API (link-only mode)
                    const driveRes = await fetch('/api/drive/fetch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ driveUrl, type: 'answer_sheet' })
                    })
                    const driveData = await driveRes.json()

                    if (!driveRes.ok || driveData.error) {
                        throw new Error(driveData.error || 'Drive fetch failed')
                    }

                    fileUrl = driveData.drivePreviewUrl
                } else {
                    // Local file upload
                    if (!item.file) {
                        setUploadItems(prev => prev.map(i =>
                            i.studentId === item.studentId
                                ? { ...i, status: 'error', error: 'No file selected' }
                                : i
                        ))
                        continue
                    }

                    const fileExt = item.file.name.split('.').pop()
                    const fileName = `${examId}/${item.studentId}-batch-${Date.now()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('answer-sheets')
                        .upload(fileName, item.file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('answer-sheets')
                        .getPublicUrl(fileName)

                    fileUrl = publicUrl
                }

                // Create answer sheet record
                const { data: sheetData, error: dbError } = await supabase
                    .from('answer_sheets')
                    .insert({
                        exam_id: examId,
                        student_id: item.studentId,
                        file_urls: [fileUrl],
                        status: 'processing'
                    })
                    .select()
                    .single()

                if (dbError) throw dbError

                // Trigger grading
                await fetch('/api/gemini/grade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sheetId: sheetData.id,
                        fileUrls: [fileUrl],
                        examId
                    })
                })

                setUploadItems(prev => prev.map(i =>
                    i.studentId === item.studentId ? { ...i, status: 'success' } : i
                ))

            } catch (error: any) {
                console.error(`Batch upload error for ${item.studentName}:`, error)
                setUploadItems(prev => prev.map(i =>
                    i.studentId === item.studentId
                        ? { ...i, status: 'error', error: error.message }
                        : i
                ))
            }
        }

        setIsProcessing(false)
        const successCount = uploadItems.filter(i => i.status === 'success').length
        toast.success(`Batch upload complete: ${successCount}/${students.length} successful`)
        router.refresh()
    }

    const readyCount = uploadMode === 'file'
        ? uploadItems.filter(i => i.file).length
        : Object.keys(driveLinks).filter(k => driveLinks[k]?.trim()).length

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="text-cyan-400" />
                        Batch Upload Answer Sheets
                    </DialogTitle>
                    <DialogDescription>
                        Upload answer sheets for multiple students at once
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Toggle */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    <button
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${uploadMode === 'file'
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <UploadCloud className="w-4 h-4" />
                        Upload Files
                    </button>
                    <button
                        onClick={() => setUploadMode('drive')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${uploadMode === 'drive'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Link2 className="w-4 h-4" />
                        Google Drive Links
                    </button>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto space-y-2 py-2">
                    {students.map(student => {
                        const item = uploadItems.find(i => i.studentId === student.id)

                        return (
                            <div key={student.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono">
                                    {student.roll_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{student.name}</p>
                                    {uploadMode === 'file' ? (
                                        <div className="relative mt-1">
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => e.target.files?.[0] && handleFileSelect(student.id, e.target.files[0])}
                                                disabled={isProcessing}
                                            />
                                            <div className="text-xs text-muted-foreground truncate">
                                                {item?.file?.name || 'Click to select file...'}
                                            </div>
                                        </div>
                                    ) : (
                                        <Input
                                            placeholder="https://drive.google.com/file/d/..."
                                            value={driveLinks[student.id] || ''}
                                            onChange={(e) => handleDriveLinkChange(student.id, e.target.value)}
                                            className="mt-1 h-7 text-xs bg-white/5 border-white/10"
                                            disabled={isProcessing}
                                        />
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    {item?.status === 'uploading' && (
                                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                    )}
                                    {item?.status === 'success' && (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    )}
                                    {item?.status === 'error' && (
                                        <div className="relative group">
                                            <X className="w-5 h-5 text-red-400" />
                                            <div className="absolute right-0 top-full mt-1 w-40 p-2 bg-slate-800 rounded text-xs text-red-300 opacity-0 group-hover:opacity-100 z-10">
                                                {item.error}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <p className="text-sm text-muted-foreground">
                        {readyCount} of {students.length} ready
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBatchUpload}
                            disabled={readyCount === 0 || isProcessing}
                            className="bg-cyan-600 hover:bg-cyan-500"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `Upload & Grade ${readyCount} Sheets`
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
