"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { Loader2, LayoutDashboard, GraduationCap, ArrowLeft } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVoiceForm } from "@/components/voice-assistant"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [section, setSection] = useState("")
  const [name, setName] = useState("")

  const [role, setRole] = useState<"admin" | "student">("admin")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Voice Assistant Integration
  const voiceFieldSetters = useMemo(() => ({
    email: setEmail,
    password: setPassword,
    name: setName,
    fullName: setFullName,
    rollNumber: setRollNumber,
    roll: setRollNumber, // Alias
    studentClass: setStudentClass,
    class: setStudentClass, // Alias
    section: setSection
  }), [])

  useVoiceForm("signup", voiceFieldSetters)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      if (role === "student") {
        // 1. Sign Up Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'student',
              roll_number: rollNumber,
              class: studentClass,
              full_name: name // Store in metadata too
            }
          }
        })

        if (authError) throw authError

        if (authData.user) {
          // 2. Link Student Record using RPC (Securely)
          const { error: linkError } = await supabase
            .rpc('link_student_account', {
              p_roll_number: rollNumber,
              p_class: studentClass,
              p_email: email,
              p_name: name,
              p_section: section
            })

          if (linkError) {
            console.error("Linking failed:", linkError)
            throw new Error(linkError.message || "Failed to link to student profile. Ensure your Roll Number and Class are correct.")
          }

          router.push("/student/dashboard")
        }
      } else {
        // Admin / Teacher Signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName,
              role: 'teacher',
            },
          },
        })
        if (error) throw error
        router.push("/auth/sign-up-success")
      }

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-mesh-light dark:bg-mesh-dark p-6 md:p-10 transition-colors duration-500">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="z-10 w-full max-w-lg"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-center text-center relative">
            <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </Link>
            <div className="mb-4">
              <Logo />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Create Account</h1>
            <p className="text-muted-foreground mt-1">
              Join MARK AI to grade smarter
            </p>
          </div>

          <GlassCard variant="liquid" className="p-8 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl">
            
            <Tabs defaultValue="admin" className="w-full mb-8" onValueChange={(val) => setRole(val as "admin" | "student")}>
              <TabsList className="grid w-full grid-cols-2 p-1.5 bg-secondary/50 rounded-full h-auto">
                <TabsTrigger
                  value="admin"
                  className="rounded-full py-2.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-md"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Teacher
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="rounded-full py-2.5 transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-md"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Student
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSignUp} className="space-y-6">
              
              {role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="pl-1">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                  />
                </div>
              )}

              {role === 'student' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="studentName" className="pl-1">Full Name</Label>
                    <Input
                      id="studentName"
                      placeholder="Student Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="class" className="pl-1">Class</Label>
                      <Input
                        id="class"
                        placeholder="10"
                        required
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section" className="pl-1">Sec</Label>
                      <Input
                        id="section"
                        placeholder="A"
                        required
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roll" className="pl-1">Roll</Label>
                      <Input
                        id="roll"
                        placeholder="101"
                        required
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="pl-1">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="pl-1">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full text-lg shadow-xl shadow-primary/20 mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/" className="text-primary font-semibold hover:underline underline-offset-4">
                  Log in
                </Link>
              </p>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  )
}
