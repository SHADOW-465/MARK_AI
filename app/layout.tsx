import type React from "react"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { VoiceAssistantWrapper } from "@/components/voice-assistant/voice-assistant-wrapper"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata = {
  title: "MARK AI - Intelligent Grading Platform",
  description: "AI-powered grading system for K-12 schools",
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-mesh-light dark:bg-mesh-dark min-h-screen transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <VoiceAssistantWrapper>
            {children}
          </VoiceAssistantWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
