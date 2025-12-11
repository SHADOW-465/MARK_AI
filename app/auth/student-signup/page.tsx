"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, GraduationCap } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"

export default function StudentSignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
        // 1. Verify Student Exists in DB first
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("id, email, user_id")
            .eq("roll_number", rollNumber)
            .eq("class", studentClass)
            .single()

        if (studentError || !student) {
            throw new Error("Student details not found. Please check your Class and Roll Number.")
        }

        // Strictly enforce email consistency
        if (student.email && student.email.toLowerCase() !== email.toLowerCase()) {
            throw new Error("This student ID is already linked to a different email address. Please use the assigned email or contact your teacher.")
        }

        if (student.user_id) {
            throw new Error("This student account is already registered. Please login.")
        }

        // 2. Sign Up Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'student',
                    roll_number: rollNumber,
                    class: studentClass
                }
            }
        })

        if (authError) throw authError

        if (authData.user) {
            // 3. Link Student Record to Auth User
            const { error: updateError } = await supabase
                .from("students")
                .update({ user_id: authData.user.id, email: email }) // Update email too if needed
                .eq("id", student.id)

            if (updateError) {
                // If linking fails, we might want to delete the auth user?
                // For now, just show error.
                console.error("Linking failed:", updateError)
                throw new Error("Account created but failed to link to student profile. Contact support.")
            }

            router.push("/student/dashboard")
        }

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6 md:p-10">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-neon-purple/20 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-neon-cyan/20 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-sm"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center mb-4">
            <Logo />
          </div>
          <GlassCard className="p-6 backdrop-blur-xl border-white/10">
            <div className="flex flex-col space-y-2 text-center mb-6">
              <div className="mx-auto w-10 h-10 rounded-full bg-neon-purple/10 flex items-center justify-center text-neon-purple mb-2">
                  <GraduationCap size={20} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Student Registration</h1>
              <p className="text-sm text-muted-foreground">
                Activate your student account
              </p>
            </div>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="class">Class</Label>
                        <Input
                            id="class"
                            type="text"
                            placeholder="e.g. 10A"
                            required
                            value={studentClass}
                            onChange={(e) => setStudentClass(e.target.value)}
                            className="bg-background/50 border-white/10 focus:border-neon-purple/50 focus:ring-neon-purple/20"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="roll">Roll Number</Label>
                        <Input
                            id="roll"
                            type="text"
                            placeholder="e.g. 101"
                            required
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            className="bg-background/50 border-white/10 focus:border-neon-purple/50 focus:ring-neon-purple/20"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-white/10 focus:border-neon-purple/50 focus:ring-neon-purple/20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-white/10 focus:border-neon-purple/50 focus:ring-neon-purple/20"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-neon-purple to-pink-500 hover:opacity-90 transition-opacity text-white font-bold mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Activate Account"
                  )}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already registered?{" "}
                <Link href="/auth/login" className="text-neon-cyan hover:text-neon-purple transition-colors underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </form>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  )
}
