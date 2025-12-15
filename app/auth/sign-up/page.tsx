"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, LayoutDashboard, GraduationCap } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [name, setName] = useState("") // Students also enter name now? No, they claim the name. But let's ask for it just in case or display it.
  // Actually, the prompt said: "student sign up should ask for the roll number, name, class and email"
  // If the teacher already added "Rahul", and the student enters "Rahul Kumar", should we update it?
  // Let's allow Name input for students too.

  const [role, setRole] = useState<"admin" | "student">("admin")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
            // We use the RPC function we planned.
            const { data: linkData, error: linkError } = await supabase
                .rpc('link_student_account', {
                    p_roll_number: rollNumber,
                    p_class: studentClass,
                    p_email: email
                })

            if (linkError) {
                // If RPC fails (e.g. student not found, or already linked)
                // We should probably rollback the auth user creation or just show error.
                // Since we can't easily rollback auth user from client, we show error.
                // The user is created but not linked. They can't do anything.
                console.error("Linking failed:", linkError)
                throw new Error(linkError.message || "Failed to link to student profile. Ensure your Roll Number and Class are correct and not already registered.")
            }

            // 3. Update Name if provided (Optional, but good UX)
            // Now that we are linked, we might be able to update our own name if RLS allows,
            // or we rely on the teacher's input.
            // Let's skip updating name for now to avoid RLS complexity, as the RPC only updates email/user_id.

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6 md:p-10">
      {/* Ambient Background Effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-neon-cyan/20 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-neon-purple/20 blur-[100px]" />

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
              <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
              <p className="text-sm text-muted-foreground">
                Join MARK AI to start grading smarter
              </p>
            </div>

            <Tabs defaultValue="admin" className="w-full mb-6" onValueChange={(val) => setRole(val as "admin" | "student")}>
              <TabsList className="grid w-full grid-cols-2 p-1 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-lg">
                <TabsTrigger
                  value="admin"
                  className="rounded-md transition-all duration-300 data-[state=active]:bg-neon-cyan/10 data-[state=active]:text-neon-cyan data-[state=active]:shadow-[0_0_20px_-5px_rgba(0,243,255,0.3)] data-[state=active]:border-neon-cyan/20 border border-transparent"
                >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="rounded-md transition-all duration-300 data-[state=active]:bg-neon-purple/10 data-[state=active]:text-neon-purple data-[state=active]:shadow-[0_0_20px_-5px_rgba(188,19,254,0.3)] data-[state=active]:border-neon-purple/20 border border-transparent"
                >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Student
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">

                {role === 'admin' && (
                    <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        placeholder="John Doe"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-background/50 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
                    />
                    </div>
                )}

                {role === 'student' && (
                    <>
                    <div className="grid gap-2">
                        <Label htmlFor="studentName">Full Name</Label>
                        <Input
                            id="studentName"
                            placeholder="John Doe"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background/50 border-white/10 focus:border-neon-purple/50 focus:ring-neon-purple/20"
                        />
                    </div>
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
                    </>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`bg-background/50 border-white/10 ${role === 'student' ? 'focus:border-neon-purple/50 focus:ring-neon-purple/20' : 'focus:border-neon-cyan/50 focus:ring-neon-cyan/20'}`}
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
                    className={`bg-background/50 border-white/10 ${role === 'student' ? 'focus:border-neon-purple/50 focus:ring-neon-purple/20' : 'focus:border-neon-cyan/50 focus:ring-neon-cyan/20'}`}
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  className={`w-full text-white font-bold transition-opacity hover:opacity-90 ${
                    role === 'student'
                    ? 'bg-gradient-to-r from-neon-purple to-pink-500'
                    : 'bg-gradient-to-r from-neon-cyan to-neon-purple'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign up"
                  )}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/" className="text-neon-cyan hover:text-neon-purple transition-colors underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  )
}
