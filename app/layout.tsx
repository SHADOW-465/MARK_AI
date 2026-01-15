import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { VoiceAssistantWrapper } from "@/components/voice-assistant/voice-assistant-wrapper"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata = {
  title: "MARK AI - AI Grading System",
  description: "AI-powered grading system for K-12 schools in Tamil Nadu",
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
