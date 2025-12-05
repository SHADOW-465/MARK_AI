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
import { Loader2, UploadCloud, FileText, CheckCircle, AlertCircle, ChevronRight, X } from "lucide-react"
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

            // Insert or Update Answer Sheet
            // We use upsert to handle re-uploads if needed, but for now insert is fine as per logic
            // Actually, if a sheet exists, we might want to update it. But the UI shows "Review" if sheet exists.
            // So this is for new uploads.

            const { data: sheetData, error: dbError } = await supabase
                .from("answer_sheets")
                .insert({
                    exam_id: examId,
                    student_id: studentId,
                    file_urls: uploadedUrls, // New column
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
                                        <Link href={`/dashboard/grading/${examId}/${sheet.id}`}>
                                            <Button variant="ghost" size="sm" className="hover:bg-cyan-500/20 hover:text-cyan-400">
                                                Review <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </Link>
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
                                                    <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:bg-white/5 transition-colors relative">
                                                        <Input
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            multiple // Enable multiple files
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

                                                    {/* File List */}
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
