'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/design-system';

const avatarVariants = cva(
    'relative flex shrink-0 overflow-hidden rounded-full',
    {
        variants: {
            size: {
                xs: 'h-6 w-6',
                sm: 'h-8 w-8',
                md: 'h-10 w-10',
                lg: 'h-12 w-12',
                xl: 'h-16 w-16',
                '2xl': 'h-20 w-20',
                '3xl': 'h-24 w-24',
            },
            status: {
                none: '',
                online: 'ring-2 ring-status-success ring-offset-2 ring-offset-background-primary',
                offline: 'ring-2 ring-text-tertiary ring-offset-2 ring-offset-background-primary',
                speaking: 'ring-2 ring-voice-speaking ring-offset-2 ring-offset-background-primary animate-pulse',
                muted: 'ring-2 ring-voice-muted ring-offset-2 ring-offset-background-primary',
            },
        },
        defaultVariants: {
            size: 'md',
            status: 'none',
        },
    }
);

export interface AvatarProps
    extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
    src?: string;
    alt?: string;
    fallback?: string;
    showStatus?: boolean;
    statusPosition?: 'bottom-right' | 'top-right';
}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
    ({ className, size, status, src, alt, fallback, showStatus = false, statusPosition = 'bottom-right', ...props }, ref) => {
        // Generate initials from fallback
        const initials = fallback
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

        return (
            <div className="relative inline-flex">
                <AvatarPrimitive.Root
                    ref={ref}
                    className={cn(avatarVariants({ size, status }), className)}
                    {...props}
                >
                    <AvatarPrimitive.Image
                        src={src}
                        alt={alt}
                        className="aspect-square h-full w-full object-cover"
                    />
                    <AvatarPrimitive.Fallback
                        className="flex h-full w-full items-center justify-center bg-primary-600 text-white font-medium"
                        delayMs={600}
                    >
                        {initials}
                    </AvatarPrimitive.Fallback>
                </AvatarPrimitive.Root>

                {showStatus && status && status !== 'none' && (
                    <span
                        className={cn(
                            'absolute block rounded-full border-2 border-background-primary',
                            statusPosition === 'bottom-right' ? 'bottom-0 right-0' : 'top-0 right-0',
                            size === 'xs' && 'h-1.5 w-1.5',
                            size === 'sm' && 'h-2 w-2',
                            size === 'md' && 'h-2.5 w-2.5',
                            size === 'lg' && 'h-3 w-3',
                            (size === 'xl' || size === '2xl' || size === '3xl') && 'h-4 w-4',
                            status === 'online' && 'bg-status-success',
                            status === 'offline' && 'bg-text-tertiary',
                            status === 'speaking' && 'bg-voice-speaking animate-pulse',
                            status === 'muted' && 'bg-voice-muted'
                        )}
                    />
                )}
            </div>
        );
    }
);
Avatar.displayName = 'Avatar';

// Avatar Group for showing multiple users
interface AvatarGroupProps {
    avatars: Array<{
        src?: string;
        alt?: string;
        fallback?: string;
    }>;
    max?: number;
    size?: VariantProps<typeof avatarVariants>['size'];
    className?: string;
}

const AvatarGroup = ({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) => {
    const displayAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className={cn('flex -space-x-2', className)}>
            {displayAvatars.map((avatar, index) => (
                <Avatar
                    key={index}
                    size={size}
                    src={avatar.src}
                    alt={avatar.alt}
                    fallback={avatar.fallback}
                    className="border-2 border-background-primary"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        'flex items-center justify-center rounded-full bg-surface-default border-2 border-background-primary text-xs font-medium text-text-secondary',
                        size === 'xs' && 'h-6 w-6',
                        size === 'sm' && 'h-8 w-8',
                        size === 'md' && 'h-10 w-10 text-sm',
                        size === 'lg' && 'h-12 w-12 text-sm',
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};

export { Avatar, AvatarGroup, avatarVariants };
