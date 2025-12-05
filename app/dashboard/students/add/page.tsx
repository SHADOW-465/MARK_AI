"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AddStudentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [name, setName] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [className, setClassName] = useState("")
  const [section, setSection] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // In a real app, we'd link this to a school_id.
      // For now, we'll just insert.
      const { error } = await supabase.from("students").insert({
        teacher_id: user.id, // Link student to teacher
        name,
        roll_number: rollNumber,
        class: className,
        section,
      })

      if (error) throw error
      router.push("/dashboard/students")
    } catch (error) {
      console.error("Error adding student:", error)
      alert("Failed to add student")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Add Student
        </h1>
        <p className="text-muted-foreground">Register a new student to the system.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
            <CardDescription>Basic information about the student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g. Rahul Sharma"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roll">Roll Number</Label>
              <Input
                id="roll"
                placeholder="e.g. 101"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  placeholder="e.g. 10"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Student"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
