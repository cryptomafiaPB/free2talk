import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/design-system';
import { colors } from '@/lib/design-system/tokens/colors';

const badgeVariants = cva(
    'inline-flex items-center rounded-full font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-surface-default text-text-secondary border border-surface-border',
                primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
                secondary: 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30',
                success: 'bg-status-success/20 text-status-success border border-status-success/30',
                warning: 'bg-status-warning/20 text-status-warning border border-status-warning/30',
                error: 'bg-status-error/20 text-status-error border border-status-error/30',
                info: 'bg-status-info/20 text-status-info border border-status-info/30',
                outline: 'border border-surface-border text-text-secondary bg-transparent',
            },
            size: {
                sm: 'px-2 py-0.5 text-[10px]',
                md: 'px-2.5 py-0.5 text-xs',
                lg: 'px-3 py-1 text-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    dot?: boolean;
    dotColor?: string;
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
            {dot && (
                <span
                    className="mr-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: dotColor || 'currentColor' }}
                />
            )}
            {children}
        </div>
    );
}

// Language Badge - Special variant for language tags
interface LanguageBadgeProps {
    language: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const languageColors: Record<string, string> = {
    english: colors.language.english,
    spanish: colors.language.spanish,
    french: colors.language.french,
    german: colors.language.german,
    japanese: colors.language.japanese,
    korean: colors.language.korean,
    chinese: colors.language.chinese,
    portuguese: colors.language.portuguese,
    russian: colors.language.russian,
    arabic: colors.language.arabic,
};

function LanguageBadge({ language, size = 'md', className }: LanguageBadgeProps) {
    const normalizedLang = language.toLowerCase();
    const color = languageColors[normalizedLang] || colors.language.default;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md font-medium',
                size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
                size === 'md' && 'px-2 py-0.5 text-xs',
                size === 'lg' && 'px-2.5 py-1 text-sm',
                className
            )}
            style={{
                backgroundColor: `${color}20`,
                color: color,
                borderWidth: 1,
                borderColor: `${color}40`,
            }}
        >
            {language}
        </span>
    );
}

// Status Badge
interface StatusBadgeProps {
    status: 'live' | 'active' | 'full' | 'closed';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
    const statusConfig = {
        live: { color: colors.status.error, label: 'Live', pulse: true },
        active: { color: colors.status.success, label: 'Active', pulse: false },
        full: { color: colors.status.warning, label: 'Full', pulse: false },
        closed: { color: colors.text.tertiary, label: 'Closed', pulse: false },
    };

    const config = statusConfig[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium',
                size === 'sm' && 'px-2 py-0.5 text-[10px]',
                size === 'md' && 'px-2.5 py-0.5 text-xs',
                size === 'lg' && 'px-3 py-1 text-sm',
                className
            )}
            style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
            }}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    config.pulse && 'animate-pulse'
                )}
                style={{ backgroundColor: config.color }}
            />
            {config.label}
        </span>
    );
}

// Participant Count Badge
interface ParticipantBadgeProps {
    count: number;
    max: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function ParticipantBadge({ count, max, size = 'md', className }: ParticipantBadgeProps) {
    const isFull = count >= max;
    const isAlmostFull = count >= max * 0.8;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md font-medium',
                size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
                size === 'md' && 'px-2 py-0.5 text-xs',
                size === 'lg' && 'px-2.5 py-1 text-sm',
                isFull && 'bg-status-error/20 text-status-error',
                isAlmostFull && !isFull && 'bg-status-warning/20 text-status-warning',
                !isAlmostFull && 'bg-surface-default text-text-secondary',
                className
            )}
        >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            {count}/{max}
        </span>
    );
}

export { Badge, LanguageBadge, StatusBadge, ParticipantBadge, badgeVariants };
