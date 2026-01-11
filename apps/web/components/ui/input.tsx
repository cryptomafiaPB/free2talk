import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/design-system';

const inputVariants = cva(
    `flex w-full rounded-xl border bg-surface-default px-4 py-2.5
   text-sm text-text-primary placeholder:text-text-tertiary
   transition-all duration-200
   focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
   disabled:cursor-not-allowed disabled:opacity-50`,
    {
        variants: {
            variant: {
                default: 'border-surface-border hover:border-surface-hover',
                error: 'border-status-error/50 focus:ring-status-error/50 focus:border-status-error',
                success: 'border-status-success/50 focus:ring-status-success/50 focus:border-status-success',
            },
            inputSize: {
                sm: 'h-9 px-3 text-xs',
                md: 'h-11 px-4 text-sm',
                lg: 'h-12 px-5 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            inputSize: 'md',
        },
    }
);

export interface InputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
    error?: string;
    label?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, inputSize, error, label, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
        const inputId = id || props.name;
        const hasError = !!error;

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-text-secondary"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        className={cn(
                            inputVariants({ variant: hasError ? 'error' : variant, inputSize }),
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {(error || helperText) && (
                    <p className={cn(
                        'text-xs',
                        hasError ? 'text-status-error' : 'text-text-tertiary'
                    )}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Search Input variant
const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'leftIcon'>>(
    ({ className, ...props }, ref) => {
        return (
            <Input
                ref={ref}
                leftIcon={
                    <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                }
                placeholder="Search..."
                className={cn('bg-background-tertiary', className)}
                {...props}
            />
        );
    }
);

SearchInput.displayName = 'SearchInput';

export { Input, SearchInput, inputVariants };
