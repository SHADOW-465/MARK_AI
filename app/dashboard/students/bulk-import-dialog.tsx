"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { UploadCloud, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

export function BulkImportDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0])
        }
    }

    const handleImport = async () => {
        if (!file) return

        setIsImporting(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const reader = new FileReader()
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

                if (jsonData.length === 0) {
                    toast.error("The file is empty")
                    setIsImporting(false)
                    return
                }

                // Map data and insert
                const studentsToInsert = jsonData.map(row => ({
                    name: row.Name || row.name || "",
                    roll_number: String(row["Roll No"] || row.roll_number || ""),
                    class: String(row.Class || row.class || ""),
                    section: String(row.Section || row.section || ""),
                    teacher_id: user.id
                })).filter(s => s.name && s.roll_number && s.class)

                if (studentsToInsert.length === 0) {
                    toast.error("No valid student data found in file")
                    setIsImporting(false)
                    return
                }

                const { error } = await supabase
                    .from("students")
                    .upsert(studentsToInsert, { onConflict: "roll_number,class" })

                if (error) throw error

                toast.success(`Successfully imported ${studentsToInsert.length} students`)
                setIsOpen(false)
                setFile(null)
                router.refresh()
            }
            reader.readAsArrayBuffer(file)
        } catch (error) {
            console.error("Import error:", error)
            toast.error("Failed to import students")
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Bulk Import
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Students</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Upload a CSV or Excel file containing student details.
                        Required columns: <code className="text-cyan-400">Name</code>, <code className="text-cyan-400">Roll No</code>, <code className="text-cyan-400">Class</code>.
                        Optional: <code className="text-cyan-400">Section</code>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg p-6 bg-slate-950/50 hover:bg-slate-950/80 transition-colors">
                        <Input
                            id="file"
                            type="file"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <Label
                            htmlFor="file"
                            className="flex flex-col items-center gap-2 cursor-pointer w-full text-center"
                        >
                            <UploadCloud className="h-10 w-10 text-slate-500" />
                            <span className="text-sm text-slate-300">
                                {file ? file.name : "Click to select a file"}
                            </span>
                            <span className="text-xs text-slate-500">CSV or Excel (xlsx)</span>
                        </Label>
                    </div>
                    {file && (
                        <div className="bg-slate-800/50 p-3 rounded flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs text-slate-400">Ready to import students from {file.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-end">
                    <Button
                        onClick={handleImport}
                        disabled={!file || isImporting}
                        className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            "Start Import"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
