'use client';

import { cn } from '@/lib/design-system';
import { MobileNav, FloatingActionButton } from './mobile-nav';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface MainLayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showSidebar?: boolean;
    showMobileNav?: boolean;
    showFAB?: boolean;
    headerTitle?: string;
}

export function MainLayout({
    children,
    showHeader = true,
    showSidebar = true,
    showMobileNav = true,
    showFAB = true,
    headerTitle,
}: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar - Desktop only */}
            {showSidebar && <Sidebar />}

            {/* Main Content Area */}
            <div className={cn(
                'flex flex-col min-h-screen',
                showSidebar && 'md:ml-64'
            )}>
                {/* Header */}
                {showHeader && <Header title={headerTitle} />}

                {/* Page Content */}
                <main className={cn(
                    'flex-1',
                    showMobileNav && 'pb-20 md:pb-0' // Account for mobile nav
                )}>
                    {children}
                </main>
            </div>

            {/* Mobile Navigation */}
            {showMobileNav && <MobileNav />}

            {/* Floating Action Button - Mobile only */}
            {showFAB && <FloatingActionButton />}
        </div>
    );
}

// Page container with consistent padding
interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function PageContainer({ children, className, maxWidth = 'xl' }: PageContainerProps) {
    const maxWidthClasses = {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        full: 'max-w-full',
    };

    return (
        <div className={cn(
            'px-4 py-4 md:px-6 md:py-6 mx-auto w-full',
            maxWidthClasses[maxWidth],
            className
        )}>
            {children}
        </div>
    );
}

// Section component for consistent spacing
interface SectionProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export function Section({ children, className, title, description, action }: SectionProps) {
    return (
        <section className={cn('space-y-4', className)}>
            {(title || description || action) && (
                <div className="flex items-start justify-between gap-4">
                    <div>
                        {title && (
                            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                        )}
                        {description && (
                            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
