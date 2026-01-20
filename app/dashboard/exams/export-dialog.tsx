"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Download, FileText, FileCode, FileType, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"
import { saveAs } from "file-saver"

interface ExportDialogProps {
    exam: any
}

export function ExportDialog({ exam }: ExportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const exportAsText = () => {
        setIsExporting(true)
        try {
            let content = `${exam.exam_name}\n`
            content += `Subject: ${exam.subject}\n`
            content += `Class: ${exam.class}\n`
            content += `Date: ${new Date(exam.exam_date).toLocaleDateString()}\n`
            content += `Total Marks: ${exam.total_marks}\n\n`
            content += `QUESTIONS:\n`

            exam.marking_scheme?.sort((a: any, b: any) => a.question_num - b.question_num).forEach((q: any) => {
                content += `\nQ${q.question_num}. ${q.question_text} (${q.max_marks} Marks)\n`
            })

            const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
            saveAs(blob, `${exam.exam_name.replace(/\s+/g, "_")}_Exam.txt`)
            toast.success("Exam exported as Text")
            setIsOpen(false)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export as Text")
        } finally {
            setIsExporting(false)
        }
    }

    const exportAsPDF = () => {
        setIsExporting(true)
        try {
            const doc = new jsPDF()
            let y = 20

            doc.setFontSize(22)
            doc.text(exam.exam_name, 20, y)
            y += 15

            doc.setFontSize(12)
            doc.text(`Subject: ${exam.subject}`, 20, y)
            y += 7
            doc.text(`Class: ${exam.class}`, 20, y)
            y += 7
            doc.text(`Date: ${new Date(exam.exam_date).toLocaleDateString()}`, 20, y)
            y += 7
            doc.text(`Total Marks: ${exam.total_marks}`, 20, y)
            y += 15

            doc.setFontSize(14)
            doc.text("Questions:", 20, y)
            y += 10

            doc.setFontSize(12)
            exam.marking_scheme?.sort((a: any, b: any) => a.question_num - b.question_num).forEach((q: any) => {
                if (y > 270) {
                    doc.addPage()
                    y = 20
                }
                const text = `Q${q.question_num}. ${q.question_text} [${q.max_marks} Marks]`
                const lines = doc.splitTextToSize(text, 170)
                doc.text(lines, 20, y)
                y += lines.length * 7 + 5
            })

            doc.save(`${exam.exam_name.replace(/\s+/g, "_")}_Exam.pdf`)
            toast.success("Exam exported as PDF")
            setIsOpen(false)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export as PDF")
        } finally {
            setIsExporting(false)
        }
    }

    const exportAsDoc = async () => {
        setIsExporting(true)
        try {
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: [
                            new Paragraph({
                                text: exam.exam_name,
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Subject: ${exam.subject}`, bold: true }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Class: ${exam.class}`, bold: true }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Date: ${new Date(exam.exam_date).toLocaleDateString()}`, bold: true }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Total Marks: ${exam.total_marks}`, bold: true }),
                                ],
                            }),
                            new Paragraph({ text: "" }),
                            new Paragraph({
                                text: "Questions:",
                                heading: HeadingLevel.HEADING_2,
                            }),
                            ...exam.marking_scheme?.sort((a: any, b: any) => a.question_num - b.question_num).flatMap((q: any) => [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `Q${q.question_num}. `, bold: true }),
                                        new TextRun(q.question_text),
                                        new TextRun({ text: ` [${q.max_marks} Marks]`, bold: true }),
                                    ],
                                    spacing: { before: 200 },
                                })
                            ]),
                        ],
                    },
                ],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `${exam.exam_name.replace(/\s+/g, "_")}_Exam.docx`)
            toast.success("Exam exported as Word document")
            setIsOpen(false)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export as Word document")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex w-full items-center px-2 py-1.5 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/10 outline-none">
                    <Download className="mr-2 h-4 w-4" />
                    Export Exam
                </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Export Exam</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Choose a format to export <span className="text-white font-medium">{exam.exam_name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-4">
                    <Button
                        variant="outline"
                        className="h-16 justify-start gap-4 border-slate-700 bg-slate-950/50 hover:bg-slate-800 hover:text-white"
                        onClick={exportAsPDF}
                        disabled={isExporting}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                            <FileType className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">PDF Document</div>
                            <div className="text-xs text-slate-500">Best for printing and sharing</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-16 justify-start gap-4 border-slate-700 bg-slate-950/50 hover:bg-slate-800 hover:text-white"
                        onClick={exportAsDoc}
                        disabled={isExporting}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Word Document (.docx)</div>
                            <div className="text-xs text-slate-500">Editable Microsoft Word format</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-16 justify-start gap-4 border-slate-700 bg-slate-950/50 hover:bg-slate-800 hover:text-white"
                        onClick={exportAsText}
                        disabled={isExporting}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10 text-slate-300">
                            <FileCode className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Plain Text (.txt)</div>
                            <div className="text-xs text-slate-500">Simple unformatted text</div>
                        </div>
                    </Button>
                </div>
                {isExporting && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating your file...
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
