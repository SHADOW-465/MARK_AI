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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-mesh-light dark:bg-mesh-dark p-6 md:p-10 transition-colors duration-500">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="z-10 w-full max-w-md"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-6 p-4 rounded-[2rem] bg-white/50 dark:bg-slate-800/50 shadow-xl backdrop-blur-xl border border-white/20">
              <Logo />
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Sign in to continue your journey
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

            <form onSubmit={handleLogin} className="space-y-6">
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
                    className="h-12 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="pl-1">Password</Label>
                    <Link href="#" className="text-xs text-primary hover:underline">Forgot?</Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-white/50 dark:bg-slate-900/50 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
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
                className="w-full text-lg shadow-xl shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  `Sign In`
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-primary font-semibold hover:underline underline-offset-4">
                  Create Account
                </Link>
              </p>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  )
}
