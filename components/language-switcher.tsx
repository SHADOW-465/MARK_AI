"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
] as const

export function LanguageSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLanguageChange = (locale: string) => {
    // Set cookie and refresh
    document.cookie = `MARK_AI_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`
    startTransition(() => {
      router.refresh()
    })
  }

  // Get current locale from cookie
  const getCurrentLocale = () => {
    if (typeof document === "undefined") return "en"
    const match = document.cookie.match(/MARK_AI_LOCALE=([^;]+)/)
    return match ? match[1] : "en"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground"
          disabled={isPending}
          aria-label="Change language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="cursor-pointer"
          >
            <span className="flex-1">{lang.nativeName}</span>
            <span className="text-xs text-muted-foreground ml-2">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
