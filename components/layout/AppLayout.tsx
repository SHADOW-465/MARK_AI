import { cn } from "@/lib/utils";

export interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

/**
 * AppLayout
 * Root layout container for the entire application.
 * Ensures minimum height and consistent background.
 */
export function AppLayout({ children, className, ...props }: AppLayoutProps) {
    return (
        <div
            className={cn(
                "min-h-screen bg-background text-foreground flex flex-col",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
