"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, UploadCloud, CheckCircle, ChevronRight, X, Link2, Trash2, RefreshCw, MoreHorizontal, Users, AlertTriangle, Zap, Filter, CheckCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { BatchUploadDialog } from "@/components/dashboard/batch-upload-dialog"
import { cn } from "@/lib/utils"

interface Student {
    id: string
    name: string
    roll_number: string
}

interface AnswerSheet {
    id: string
    student_id: string
    status: string
    total_score: number | null
    confidence: number | null
}

interface ExamData {
    exam_name: string
    subject: string
    total_marks: number
    marking_scheme: any[]
}

interface StudentListProps {
    examId: string
    examData: ExamData
    students: Student[]
    answerSheets: AnswerSheet[]
}

type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low' | 'pending'

export default function StudentList({ examId, examData, students, answerSheets }: StudentListProps) {
    const router = useRouter()
    const [uploadingFor, setUploadingFor] = useState<string | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [uploadMode, setUploadMode] = useState<'file' | 'drive'>('file')
    const [driveUrl, setDriveUrl] = useState('')
    const [isDriveFetching, setIsDriveFetching] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [showActionsFor, setShowActionsFor] = useState<string | null>(null)
    const [showBatchDialog, setShowBatchDialog] = useState(false)
    
    // Smart Review Queue State
    const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all')
    const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set())
    const [isBatchApproving, setIsBatchApproving] = useState(false)

    const getStudentSheet = (studentId: string) => {
        return answerSheets.find(s => s.student_id === studentId)
    }

    const getConfidenceTier = (confidence: number | null): 'high' | 'medium' | 'low' | 'unknown' => {
        if (confidence === null) return 'unknown'
        if (confidence >= 0.9) return 'high'
        if (confidence >= 0.75) return 'medium'
        return 'low'
    }

    const getConfidenceColor = (tier: string) => {
        switch (tier) {
            case 'high': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            case 'low': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    // Calculate queue statistics
    const queueStats = {
        total: answerSheets.filter(s => s.status === 'graded').length,
        high: answerSheets.filter(s => s.status === 'graded' && (s.confidence || 0) >= 0.9).length,
        medium: answerSheets.filter(s => s.status === 'graded' && (s.confidence || 0) >= 0.75 && (s.confidence || 0) < 0.9).length,
        low: answerSheets.filter(s => s.status === 'graded' && (s.confidence || 0) < 0.75).length,
        approved: answerSheets.filter(s => s.status === 'approved').length,
    }

    // Filter students based on confidence tier
    const filteredStudents = students.filter(student => {
        const sheet = getStudentSheet(student.id)
        if (confidenceFilter === 'all') return true
        if (confidenceFilter === 'pending') return !sheet || sheet.status === 'pending'
        if (!sheet || sheet.status !== 'graded') return false
        
        const tier = getConfidenceTier(sheet.confidence)
        return tier === confidenceFilter
    })

    // Get students without answer sheets for batch upload
    const studentsWithoutSheets = students.filter(s => !getStudentSheet(s.id))

    // Batch selection handlers
    const toggleSelectSheet = (sheetId: string) => {
        const newSelected = new Set(selectedSheets)
        if (newSelected.has(sheetId)) {
            newSelected.delete(sheetId)
        } else {
            newSelected.add(sheetId)
        }
        setSelectedSheets(newSelected)
    }

    const selectAllHighConfidence = () => {
        const highConfidenceSheets = answerSheets
            .filter(s => s.status === 'graded' && (s.confidence || 0) >= 0.9)
            .map(s => s.id)
        setSelectedSheets(new Set(highConfidenceSheets))
    }

    const clearSelection = () => {
        setSelectedSheets(new Set())
    }

    // Batch approve handler
    const handleBatchApprove = async () => {
        if (selectedSheets.size === 0) return
        
        if (!confirm(`Are you sure you want to approve ${selectedSheets.size} answer sheets? This will make results visible to students.`)) {
            return
        }

        setIsBatchApproving(true)
        const supabase = createClient()

        try {
            const sheetIds = Array.from(selectedSheets)
            
            for (const sheetId of sheetIds) {
                // Update answer sheet status
                await supabase
                    .from('answer_sheets')
                    .update({
                        status: 'approved',
                        approved_at: new Date().toISOString(),
                    })
                    .eq('id', sheetId)
                
                // Get sheet details for feedback analysis
                const sheet = answerSheets.find(s => s.id === sheetId)
                if (sheet) {
                    // Upsert feedback analysis WITH EXAM METADATA
                    await supabase
                        .from('feedback_analysis')
                        .upsert({
                            answer_sheet_id: sheetId,
                            student_id: sheet.student_id,
                            
                            // Exam metadata for student view (denormalized snapshot)
                            exam_name: examData.exam_name || 'Exam',
                            exam_subject: examData.subject || '',
                            exam_total_marks: examData.total_marks,
                            exam_marking_scheme: examData.marking_scheme,
                            
                            // Batch approvals don't have individual feedback
                            overall_feedback: null,
                            root_cause_analysis: null,
                            focus_areas: [],
                            real_world_application: '',
                            roi_analysis: []
                        }, {
                            onConflict: 'answer_sheet_id'
                        })
                }
            }

            toast.success(`Successfully approved ${selectedSheets.size} answer sheets`)
            setSelectedSheets(new Set())
            router.refresh()
        } catch (error) {
            console.error('Batch approve error:', error)
            toast.error('Failed to approve some answer sheets')
        } finally {
            setIsBatchApproving(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const handleUpload = async (studentId: string) => {
        if (files.length === 0) return

        setIsUploading(true)
        const supabase = createClient()

        try {
            const uploadedUrls: string[] = []

            for (const file of files) {
                const fileExt = file.name.split(".").pop()
                const fileName = `${examId}/${studentId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from("answer-sheets")
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from("answer-sheets")
                    .getPublicUrl(fileName)

                uploadedUrls.push(publicUrl)
            }

            const existingSheet = getStudentSheet(studentId)
            if (existingSheet) {
                await supabase.from('question_evaluations').delete().eq('answer_sheet_id', existingSheet.id)
                await supabase.from('feedback_analysis').delete().eq('answer_sheet_id', existingSheet.id)
                await supabase.from('answer_sheets').delete().eq('id', existingSheet.id)
            }

            const { data: sheetData, error: dbError } = await supabase
                .from("answer_sheets")
                .insert({
                    exam_id: examId,
                    student_id: studentId,
                    file_urls: uploadedUrls,
                    status: "processing",
                })
                .select()
                .single()

            if (dbError) throw dbError

            try {
                const gradeRes = await fetch("/api/gemini/grade", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sheetId: sheetData.id,
                        fileUrls: uploadedUrls,
                        examId: examId,
                    }),
                })

                const gradeData = await gradeRes.json()

                if (!gradeRes.ok || gradeData.error) {
                    await supabase
                        .from('answer_sheets')
                        .update({ status: 'error' })
                        .eq('id', sheetData.id)
                    throw new Error(gradeData.error || 'Grading failed')
                }

                toast.success("Answer sheets uploaded and graded successfully")
            } catch (gradeError: unknown) {
                console.error("Grading error:", gradeError)
                toast.error(`Grading failed: ${gradeError instanceof Error ? gradeError.message : 'Unknown error'}`)
            }

            setIsOpen(false)
            setFiles([])
            router.refresh()
        } catch (error) {
            console.error("Error uploading:", error)
            toast.error("Failed to upload answer sheets")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDriveImport = async (studentId: string) => {
        if (!driveUrl.trim()) return

        setIsDriveFetching(true)
        try {
            const driveRes = await fetch('/api/drive/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driveUrl, type: 'answer_sheet' })
            })
            const driveData = await driveRes.json()

            if (!driveRes.ok || driveData.error) {
                throw new Error(driveData.error || 'Failed to fetch from Drive')
            }

            const supabase = createClient()

            const { data: sheetData, error: dbError } = await supabase
                .from('answer_sheets')
                .insert({
                    exam_id: examId,
                    student_id: studentId,
                    file_urls: [driveData.supabaseUrl],
                    status: 'processing',
                })
                .select()
                .single()

            if (dbError) throw dbError

            try {
                const gradeRes = await fetch('/api/gemini/grade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sheetId: sheetData.id,
                        fileUrls: [driveData.supabaseUrl],
                        examId: examId,
                    }),
                })

                const gradeData = await gradeRes.json()

                if (!gradeRes.ok || gradeData.error) {
                    await supabase
                        .from('answer_sheets')
                        .update({ status: 'error' })
                        .eq('id', sheetData.id)
                    throw new Error(gradeData.error || 'Grading failed')
                }

                toast.success(`Imported "${driveData.fileName}" and graded successfully`)
            } catch (gradeError: unknown) {
                console.error('Grading error:', gradeError)
                toast.error(`Grading failed: ${gradeError instanceof Error ? gradeError.message : 'Unknown error'}`)
            }

            setIsOpen(false)
            setDriveUrl('')
            router.refresh()
        } catch (error: unknown) {
            console.error('Drive import error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to import from Drive')
        } finally {
            setIsDriveFetching(false)
        }
    }

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm('Are you sure you want to delete this answer sheet? This will remove all grading data.')) return

        setIsDeleting(sheetId)
        const supabase = createClient()

        try {
            await supabase.from('question_evaluations').delete().eq('answer_sheet_id', sheetId)
            await supabase.from('feedback_analysis').delete().eq('answer_sheet_id', sheetId)

            const { error } = await supabase.from('answer_sheets').delete().eq('id', sheetId)
            if (error) throw error

            toast.success('Answer sheet deleted successfully')
            router.refresh()
        } catch (error: unknown) {
            console.error('Delete error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete answer sheet')
        } finally {
            setIsDeleting(null)
            setShowActionsFor(null)
        }
    }

    const handleReupload = (studentId: string) => {
        setShowActionsFor(null)
        setUploadingFor(studentId)
        setIsOpen(true)
    }

    return (
        <>
            {/* Smart Review Queue Header */}
            <GlassCard className="p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Queue Stats */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground mr-2">
                            <Filter size={14} className="inline mr-1" />
                            Filter by confidence:
                        </span>
                        <Button
                            variant={confidenceFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConfidenceFilter('all')}
                            className="h-8"
                        >
                            All ({queueStats.total + queueStats.approved})
                        </Button>
                        <Button
                            variant={confidenceFilter === 'high' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConfidenceFilter('high')}
                            className={cn("h-8", confidenceFilter !== 'high' && "border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10")}
                        >
                            <Zap size={12} className="mr-1" />
                            High ({queueStats.high})
                        </Button>
                        <Button
                            variant={confidenceFilter === 'medium' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConfidenceFilter('medium')}
                            className={cn("h-8", confidenceFilter !== 'medium' && "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10")}
                        >
                            Medium ({queueStats.medium})
                        </Button>
                        <Button
                            variant={confidenceFilter === 'low' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConfidenceFilter('low')}
                            className={cn("h-8", confidenceFilter !== 'low' && "border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10")}
                        >
                            <AlertTriangle size={12} className="mr-1" />
                            Low ({queueStats.low})
                        </Button>
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-2">
                        {queueStats.high > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllHighConfidence}
                                className="h-8 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                            >
                                <CheckCheck size={14} className="mr-1" />
                                Select High Confidence
                            </Button>
                        )}
                        {selectedSheets.size > 0 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="h-8"
                                >
                                    Clear ({selectedSheets.size})
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleBatchApprove}
                                    disabled={isBatchApproving}
                                    className="h-8 bg-primary"
                                >
                                    {isBatchApproving ? (
                                        <Loader2 size={14} className="mr-1 animate-spin" />
                                    ) : (
                                        <CheckCircle size={14} className="mr-1" />
                                    )}
                                    Approve {selectedSheets.size}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Batch Upload Button */}
            {studentsWithoutSheets.length > 0 && (
                <div className="mb-4 flex justify-end">
                    <Button
                        onClick={() => setShowBatchDialog(true)}
                        className="gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Batch Upload ({studentsWithoutSheets.length})
                    </Button>
                </div>
            )}

            {/* Batch Upload Dialog */}
            <BatchUploadDialog
                examId={examId}
                students={studentsWithoutSheets}
                isOpen={showBatchDialog}
                onClose={() => setShowBatchDialog(false)}
            />

            <GlassCard className="p-0 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="text-muted-foreground">Roll No</TableHead>
                            <TableHead className="text-muted-foreground">Name</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Confidence</TableHead>
                            <TableHead className="text-muted-foreground">Score</TableHead>
                            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border">
                        {filteredStudents.map((student) => {
                            const sheet = getStudentSheet(student.id)
                            const status = sheet?.status || "pending"
                            const confidenceTier = sheet ? getConfidenceTier(sheet.confidence) : 'unknown'
                            const canSelect = sheet && sheet.status === 'graded'

                            return (
                                <TableRow key={student.id} className="hover:bg-muted/30 border-border transition-colors">
                                    <TableCell>
                                        {canSelect && (
                                            <Checkbox
                                                checked={selectedSheets.has(sheet.id)}
                                                onCheckedChange={() => toggleSelectSheet(sheet.id)}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-muted-foreground">{student.roll_number}</TableCell>
                                    <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                                    <TableCell>
                                        {status === "pending" && (
                                            <Badge variant="outline" className="border-border text-muted-foreground">
                                                Not Submitted
                                            </Badge>
                                        )}
                                        {status === "processing" && (
                                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                Processing
                                            </Badge>
                                        )}
                                        {status === "graded" && (
                                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                Needs Review
                                            </Badge>
                                        )}
                                        {status === "approved" && (
                                            <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                                Approved
                                            </Badge>
                                        )}
                                        {status === "error" && (
                                            <Badge variant="destructive">
                                                Error
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {sheet?.confidence !== null && sheet?.confidence !== undefined ? (
                                            <Badge variant="outline" className={cn("text-xs", getConfidenceColor(confidenceTier))}>
                                                {Math.round(sheet.confidence * 100)}%
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-foreground">
                                        {sheet?.total_score !== undefined && sheet.total_score !== null
                                            ? sheet.total_score
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {sheet ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/grading/${examId}/${sheet.id}`}>
                                                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                                        Review <ChevronRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </Link>

                                                <div className="relative">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowActionsFor(showActionsFor === sheet.id ? null : sheet.id)}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>

                                                    {showActionsFor === sheet.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                                                            <button
                                                                onClick={() => handleReupload(student.id)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Reupload
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSheet(sheet.id)}
                                                                disabled={isDeleting === sheet.id}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                                            >
                                                                {isDeleting === sheet.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <Dialog open={isOpen && uploadingFor === student.id} onOpenChange={(open) => {
                                                setIsOpen(open)
                                                if (open) setUploadingFor(student.id)
                                                else {
                                                    setUploadingFor(null)
                                                    setFiles([])
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                                                        <UploadCloud className="w-4 h-4 mr-2" />
                                                        Upload
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Upload Answer Sheets</DialogTitle>
                                                        <DialogDescription>
                                                            Upload one or more pages for {student.name} ({student.roll_number})
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        {/* Tab Switcher */}
                                                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                                                            <button
                                                                onClick={() => setUploadMode('file')}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${uploadMode === 'file'
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                                    }`}
                                                            >
                                                                <UploadCloud className="w-4 h-4" />
                                                                Upload File
                                                            </button>
                                                            <button
                                                                onClick={() => setUploadMode('drive')}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${uploadMode === 'drive'
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                                    }`}
                                                            >
                                                                <Link2 className="w-4 h-4" />
                                                                Google Drive
                                                            </button>
                                                        </div>

                                                        {uploadMode === 'file' ? (
                                                            <>
                                                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors relative">
                                                                    <Input
                                                                        type="file"
                                                                        accept="image/*,application/pdf"
                                                                        multiple
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                        id={`file-upload-${student.id}`}
                                                                        onChange={handleFileChange}
                                                                    />
                                                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                                        <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                                                        <span className="text-sm font-medium text-foreground">
                                                                            Click to select files or drag and drop
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">JPG, PNG or PDF (Multiple allowed)</span>
                                                                    </div>
                                                                </div>

                                                                {files.length > 0 && (
                                                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                                        {files.map((f, i) => (
                                                                            <div key={i} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                                                                                <span className="truncate max-w-[120px] sm:max-w-[200px] text-foreground">{f.name}</span>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                                    onClick={() => removeFile(i)}
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <Button
                                                                    className="w-full"
                                                                    onClick={() => handleUpload(student.id)}
                                                                    disabled={files.length === 0 || isUploading}
                                                                >
                                                                    {isUploading ? (
                                                                        <>
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Uploading {files.length} files...
                                                                        </>
                                                                    ) : (
                                                                        `Upload ${files.length > 0 ? `${files.length} Files` : ""} & Start Grading`
                                                                    )}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="space-y-3">
                                                                    <Label htmlFor="drive-url" className="text-foreground">Google Drive Share Link</Label>
                                                                    <Input
                                                                        id="drive-url"
                                                                        placeholder="https://drive.google.com/file/d/..."
                                                                        value={driveUrl}
                                                                        onChange={(e) => setDriveUrl(e.target.value)}
                                                                        className="bg-background border-input"
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Make sure the file is shared with &quot;Anyone with link&quot; permission.
                                                                    </p>
                                                                </div>

                                                                <Button
                                                                    className="w-full"
                                                                    onClick={() => handleDriveImport(student.id)}
                                                                    disabled={!driveUrl.trim() || isDriveFetching}
                                                                >
                                                                    {isDriveFetching ? (
                                                                        <>
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Importing from Drive...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Link2 className="mr-2 h-4 w-4" />
                                                                            Import & Start Grading
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {filteredStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No students found for this filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </GlassCard>
        </>
    )
}
