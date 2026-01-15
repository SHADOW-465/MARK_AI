"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { Loader2, GraduationCap, LayoutDashboard } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVoiceForm } from "@/components/voice-assistant"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<"admin" | "student">("admin")
  const router = useRouter()

  // Voice Assistant Integration
  const voiceFieldSetters = useMemo(() => ({
    email: setEmail,
    password: setPassword
  }), [])

  useVoiceForm("login", voiceFieldSetters)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (user) {
        if (role === "student") {
          const { data: student } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", user.id)
            .single()

          if (student) {
            router.push("/student/dashboard")
          } else {
            if (user.user_metadata?.role === 'teacher') {
              setError("You are registered as a Teacher. Please login as Admin.")
              await supabase.auth.signOut()
              return
            }
            router.push("/student/dashboard")
          }
        } else {
          if (user.user_metadata?.role === 'student') {
            setError("You are registered as a Student. Please login as Student.")
            await supabase.auth.signOut()
            return
          }
          router.push("/dashboard")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6 md:p-10">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="z-10 w-full max-w-sm"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center mb-4">
            <Logo />
          </div>
          <GlassCard className="p-6 bg-card border-border shadow-lg">
            <div className="flex flex-col space-y-2 text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access the system
              </p>
            </div>

            <Tabs defaultValue="admin" className="w-full mb-6" onValueChange={(val) => setRole(val as "admin" | "student")}>
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-lg">
                <TabsTrigger
                  value="admin"
                  className="rounded-md transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Teacher
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="rounded-md transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Student
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-input focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-input focus:border-primary focus:ring-primary/20"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    `Sign in as ${role === 'admin' ? 'Teacher' : 'Student'}`
                  )}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-primary hover:underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  )
}
