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
import { Loader2, UploadCloud, FileText, CheckCircle, AlertCircle, ChevronRight, X, Link2, Trash2, RefreshCw, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

interface StudentListProps {
    examId: string
    students: Student[]
    answerSheets: AnswerSheet[]
}

export default function StudentList({ examId, students, answerSheets }: StudentListProps) {
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

    const getStudentSheet = (studentId: string) => {
        return answerSheets.find(s => s.student_id === studentId)
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

            // Upload all files
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

            // Check if sheet already exists (reupload case)
            const existingSheet = getStudentSheet(studentId)
            if (existingSheet) {
                // Delete old data first
                await supabase.from('question_evaluations').delete().eq('answer_sheet_id', existingSheet.id)
                await supabase.from('feedback_analysis').delete().eq('answer_sheet_id', existingSheet.id)
                await supabase.from('answer_sheets').delete().eq('id', existingSheet.id)
            }

            // Insert new Answer Sheet
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

            // Trigger AI Grading
            await fetch("/api/gemini/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sheetId: sheetData.id,
                    fileUrls: uploadedUrls, // Send array
                    examId: examId,
                }),
            })

            toast.success("Answer sheets uploaded and grading started")
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
            // 1. Fetch from Drive and upload to Supabase
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

            // 2. Create Answer Sheet record
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

            // 3. Trigger AI Grading
            await fetch('/api/gemini/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sheetId: sheetData.id,
                    fileUrls: [driveData.supabaseUrl],
                    examId: examId,
                }),
            })

            toast.success(`Imported "${driveData.fileName}" and grading started`)
            setIsOpen(false)
            setDriveUrl('')
            router.refresh()
        } catch (error: any) {
            console.error('Drive import error:', error)
            toast.error(error.message || 'Failed to import from Drive')
        } finally {
            setIsDriveFetching(false)
        }
    }

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm('Are you sure you want to delete this answer sheet? This will remove all grading data.')) return

        setIsDeleting(sheetId)
        const supabase = createClient()

        try {
            // Delete related records first
            await supabase.from('question_evaluations').delete().eq('answer_sheet_id', sheetId)
            await supabase.from('feedback_analysis').delete().eq('answer_sheet_id', sheetId)

            // Delete the answer sheet
            const { error } = await supabase.from('answer_sheets').delete().eq('id', sheetId)
            if (error) throw error

            toast.success('Answer sheet deleted successfully')
            router.refresh()
        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error(error.message || 'Failed to delete answer sheet')
        } finally {
            setIsDeleting(null)
            setShowActionsFor(null)
        }
    }

    const handleReupload = (studentId: string) => {
        // Close actions menu and open upload dialog
        setShowActionsFor(null)
        setUploadingFor(studentId)
        setIsOpen(true)
    }

    return (
        <GlassCard className="p-0 overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-slate-400">Roll No</TableHead>
                        <TableHead className="text-slate-400">Name</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Score</TableHead>
                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                    {students.map((student) => {
                        const sheet = getStudentSheet(student.id)
                        const status = sheet?.status || "pending"

                        return (
                            <TableRow key={student.id} className="hover:bg-white/5 border-white/5 transition-colors">
                                <TableCell className="font-mono text-slate-300">{student.roll_number}</TableCell>
                                <TableCell className="font-medium text-white">{student.name}</TableCell>
                                <TableCell>
                                    {status === "pending" && (
                                        <Badge variant="outline" className="border-slate-700 text-slate-500">
                                            Not Submitted
                                        </Badge>
                                    )}
                                    {status === "processing" && (
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Processing
                                        </Badge>
                                    )}
                                    {status === "graded" && (
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                                            Needs Review
                                        </Badge>
                                    )}
                                    {status === "approved" && (
                                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                                            Graded
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-300">
                                    {sheet?.total_score !== undefined && sheet.total_score !== null
                                        ? sheet.total_score
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {sheet ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/dashboard/grading/${examId}/${sheet.id}`}>
                                                <Button variant="ghost" size="sm" className="hover:bg-cyan-500/20 hover:text-cyan-400">
                                                    Review <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>

                                            {/* Actions Dropdown */}
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-white"
                                                    onClick={() => setShowActionsFor(showActionsFor === sheet.id ? null : sheet.id)}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>

                                                {showActionsFor === sheet.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                                        <button
                                                            onClick={() => handleReupload(student.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                            Reupload
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSheet(sheet.id)}
                                                            disabled={isDeleting === sheet.id}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
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
                                                <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
                                                    <UploadCloud className="w-4 h-4 mr-2" />
                                                    Upload
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Upload Answer Sheets</DialogTitle>
                                                    <DialogDescription>
                                                        Upload one or more pages for {student.name} ({student.roll_number})
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    {/* Tab Switcher */}
                                                    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                                                        <button
                                                            onClick={() => setUploadMode('file')}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${uploadMode === 'file'
                                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                                : 'text-slate-400 hover:text-white'
                                                                }`}
                                                        >
                                                            <UploadCloud className="w-4 h-4" />
                                                            Upload File
                                                        </button>
                                                        <button
                                                            onClick={() => setUploadMode('drive')}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${uploadMode === 'drive'
                                                                ? 'bg-purple-500/20 text-purple-400'
                                                                : 'text-slate-400 hover:text-white'
                                                                }`}
                                                        >
                                                            <Link2 className="w-4 h-4" />
                                                            Google Drive
                                                        </button>
                                                    </div>

                                                    {uploadMode === 'file' ? (
                                                        <>
                                                            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:bg-white/5 transition-colors relative">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    multiple
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                    id={`file-upload-${student.id}`}
                                                                    onChange={handleFileChange}
                                                                />
                                                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                                    <UploadCloud className="h-10 w-10 text-slate-400" />
                                                                    <span className="text-sm font-medium text-slate-200">
                                                                        Click to select files or drag and drop
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">JPG, PNG or PDF (Multiple allowed)</span>
                                                                </div>
                                                            </div>

                                                            {files.length > 0 && (
                                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                                    {files.map((f, i) => (
                                                                        <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm">
                                                                            <span className="truncate max-w-[200px] text-slate-300">{f.name}</span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-slate-500 hover:text-red-400"
                                                                                onClick={() => removeFile(i)}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <Button
                                                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
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
                                                                <Label htmlFor="drive-url" className="text-slate-300">Google Drive Share Link</Label>
                                                                <Input
                                                                    id="drive-url"
                                                                    placeholder="https://drive.google.com/file/d/..."
                                                                    value={driveUrl}
                                                                    onChange={(e) => setDriveUrl(e.target.value)}
                                                                    className="bg-white/5 border-white/10"
                                                                />
                                                                <p className="text-xs text-slate-500">
                                                                    Make sure the file is shared with &quot;Anyone with link&quot; permission.
                                                                </p>
                                                            </div>

                                                            <Button
                                                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
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
                    {students.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                No students found for this class.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </GlassCard>
    )
}
