"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
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
              <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access the system
              </p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
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
                    className="bg-background/50 border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 transition-opacity text-white font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-neon-cyan hover:text-neon-purple transition-colors underline underline-offset-4">
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
