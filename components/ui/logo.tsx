import { GraduationCap } from "lucide-react"

export const Logo = () => (
    <div className="flex items-center gap-2 select-none">
        <div className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-primary">
            <GraduationCap size={20} className="text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
            <span className="font-semibold text-lg tracking-tight text-foreground">
                MARK<span className="text-primary">AI</span>
            </span>
        </div>
    </div>
)
