import { cn } from "@/lib/utils";

export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

/**
 * SectionContainer
 * A wrapper for logical vertical sections of a page.
 * Enforces vertical spacing using tokens.
 */
export function SectionContainer({
    children,
    className,
    ...props
}: SectionContainerProps) {
    return (
        <section
            className={cn("w-full flex flex-col gap-6 md:gap-8 mb-12 last:mb-0", className)}
            {...props}
        >
            {children}
        </section>
    );
}
