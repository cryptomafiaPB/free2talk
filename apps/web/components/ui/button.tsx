import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/design-system';

const buttonVariants = cva(
    // Base styles
    `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl
   text-sm font-semibold transition-all duration-200 ease-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary
   disabled:pointer-events-none disabled:opacity-50
   active:scale-[0.98]`,
    {
        variants: {
            variant: {
                primary: `
          bg-gradient-to-r from-primary-500 to-primary-600
          text-white shadow-lg shadow-primary-500/25
          hover:from-primary-400 hover:to-primary-500 hover:shadow-primary-500/40
        `,
                secondary: `
          bg-surface-default border border-surface-border
          text-text-primary
          hover:bg-surface-hover hover:border-primary-500/30
        `,
                ghost: `
          bg-transparent
          text-text-secondary
          hover:bg-surface-hover hover:text-text-primary
        `,
                danger: `
          bg-status-error/10 border border-status-error/20
          text-status-error
          hover:bg-status-error/20 hover:border-status-error/40
        `,
                success: `
          bg-status-success/10 border border-status-success/20
          text-status-success
          hover:bg-status-success/20 hover:border-status-success/40
        `,
                outline: `
          border-2 border-primary-500/50 bg-transparent
          text-primary-400
          hover:bg-primary-500/10 hover:border-primary-500
        `,
                link: `
          bg-transparent underline-offset-4
          text-primary-400
          hover:underline
        `,
            },
            size: {
                sm: 'h-8 px-3 text-xs rounded-lg',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
                xl: 'h-14 px-8 text-lg',
                icon: 'h-10 w-10 p-0',
                iconSm: 'h-8 w-8 p-0 rounded-lg',
                iconLg: 'h-12 w-12 p-0',
            },
            fullWidth: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            fullWidth: false,
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, asChild = false, isLoading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Loading...</span>
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
