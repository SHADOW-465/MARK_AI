"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UploadCloud, type File } from "lucide-react"

export default function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchStudents = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("students").select("*").order("roll_number")
      if (data) setStudents(data)
    }
    fetchStudents()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedStudent) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${id}/${selectedStudent}-${Date.now()}.${fileExt}`

      // Note: You need to create a bucket named 'answer-sheets' in Supabase
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("answer-sheets")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("answer-sheets").getPublicUrl(fileName)

      // 2. Create answer_sheet record
      const { data: sheetData, error: dbError } = await supabase
        .from("answer_sheets")
        .insert({
          exam_id: id,
          student_id: selectedStudent,
          file_url: publicUrl,
          status: "processing", // Mark as processing initially
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 3. Trigger AI Grading (Call API Route)
      const response = await fetch("/api/gemini/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId: sheetData.id,
          fileUrl: publicUrl,
          examId: id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to trigger grading")
      }

      router.push(`/dashboard/exams/${id}`)
    } catch (error) {
      console.error("Error uploading:", error)
      alert("Failed to upload and process. Check console for details.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Answer Sheet</h1>
        <p className="text-muted-foreground">Upload a student's answer sheet for AI grading.</p>
      </div>

      <form onSubmit={handleUpload}>
        <Card>
          <CardHeader>
            <CardTitle>Upload Details</CardTitle>
            <CardDescription>Select student and attach file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Search by name or roll no" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.roll_number} - {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Answer Sheet (Image/PDF)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                />
                <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm font-medium">{file ? file.name : "Click to upload or drag and drop"}</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG or PDF (max 10MB)</span>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !file || !selectedStudent}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Upload & Grade"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
