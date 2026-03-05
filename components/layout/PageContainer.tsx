import { cn } from "@/lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    layout?: "default" | "centered" | "wide";
}

/**
 * PageContainer
 * Controls the maximum width and horizontal padding of a page.
 */
export function PageContainer({
    children,
    className,
    layout = "default",
    ...props
}: PageContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12",
                {
                    "max-w-container-xl": layout === "default",
                    "max-w-container-md": layout === "centered",
                    "max-w-full 2xl:max-w-16": layout === "wide",
                },
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
