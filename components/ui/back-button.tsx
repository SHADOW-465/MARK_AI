"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
    const router = useRouter()
    const pathname = usePathname()

    // Hide on the main dashboard page
    if (pathname === "/dashboard") {
        return null
    }

    return (
        <div className="mb-6">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="group flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 transition-all pl-0 hover:pl-2"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Back</span>
            </Button>
        </div>
    )
}
