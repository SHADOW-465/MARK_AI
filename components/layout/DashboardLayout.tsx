import { cn } from "@/lib/utils";

export interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    sidebar?: React.ReactNode;
    header?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * DashboardLayout
 * Standard sidebar + main content + header layout for SaaS dashboards.
 */
export function DashboardLayout({
    sidebar,
    header,
    children,
    className,
    ...props
}: DashboardLayoutProps) {
    return (
        <div className={cn("flex min-h-screen w-full bg-background", className)} {...props}>
            {/* Sidebar Navigation */}
            {sidebar && (
                <aside className="hidden w-panel-sidebar border-r border-border bg-card lg:block flex-shrink-0">
                    {sidebar}
                </aside>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                {/* Top Navigation / Header */}
                {header && (
                    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-border bg-background/95 backdrop-blur px-6 space-x-4">
                        {header}
                    </header>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
