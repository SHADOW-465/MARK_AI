"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useDebounce } from "@/lib/hooks/use-debounce"

export function StudentFilters({ classes }: { classes: string[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get("search") || "")
    const debouncedSearch = useDebounce(search, 500)

    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (debouncedSearch) {
            params.set("search", debouncedSearch)
        } else {
            params.delete("search")
        }
        router.push(`/dashboard/students?${params.toString()}`)
    }, [debouncedSearch, router, searchParams])

    const handleClassChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== "all") {
            params.set("class", value)
        } else {
            params.delete("class")
        }
        router.push(`/dashboard/students?${params.toString()}`)
    }

    const handleSectionChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set("section", value)
        } else {
            params.delete("section")
        }
        router.push(`/dashboard/students?${params.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative flex-1 w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-10 bg-slate-100/50 dark:bg-black/20 border-border rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select onValueChange={handleClassChange} defaultValue={searchParams.get("class") || "all"}>
                    <SelectTrigger className="w-[120px] bg-slate-100/50 dark:bg-black/20 border-border rounded-xl">
                        <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((c) => (
                            <SelectItem key={c} value={c}>Class {c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Section"
                    className="w-[100px] bg-slate-100/50 dark:bg-black/20 border-border rounded-xl"
                    defaultValue={searchParams.get("section") || ""}
                    onChange={(e) => handleSectionChange(e.target.value)}
                />
            </div>
        </div>
    )
}
