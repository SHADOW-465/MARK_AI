import { cn } from "@/lib/utils";

export interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
}

/**
 * CardContainer
 * A grid layout specifically used to display multiple cards.
 */
export function CardContainer({
    children,
    className,
    columns = 3,
    ...props
}: CardContainerProps) {
    return (
        <div
            className={cn(
                "grid w-full gap-4 sm:gap-6",
                {
                    "grid-cols-1": columns === 1,
                    "grid-cols-1 md:grid-cols-2": columns === 2,
                    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": columns === 3,
                    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4": columns === 4,
                },
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
