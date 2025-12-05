import { Hexagon, Zap } from "lucide-react"

export const Logo = () => (
    <div className="flex items-center select-none mb-8 overflow-hidden h-16 w-full">
        {/* Fixed width container for icon to match sidebar button width */}
        <div className="w-16 flex-shrink-0 flex items-center justify-center">
            <div className="relative w-10 h-10 flex items-center justify-center">
                <Hexagon className="w-full h-full text-blue-400 fill-blue-900/20 stroke-[1.5]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={18} className="text-cyan-300 fill-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                </div>
            </div>
        </div>

        {/* Text hides/shows based on sidebar group hover */}
        <div className="flex flex-col leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pl-1">
            <span className="font-display font-bold text-2xl tracking-widest text-white drop-shadow-md">
                MARK <span className="text-cyan-400">AI</span>
            </span>
        </div>
    </div>
)
