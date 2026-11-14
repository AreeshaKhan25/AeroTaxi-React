import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padded?: boolean;
  interactive?: boolean;
  tone?: 'white' | 'cream' | 'muted';
}

const TONES = {
  white: 'bg-white border-gray-100',
  cream: 'bg-cream border-transparent',
  muted: 'bg-gray-50 border-gray-100',
} as const;

export function Card({
  as: Tag = 'div',
  padded = true,
  interactive = false,
  tone = 'white',
  className,
  children,
  ...rest
}: CardProps) {
  /* `as` lets a card render as a list item or section without re-typing props. */
  const Component = Tag as React.ElementType;

  return (
    <Component
      className={cn(
        'rounded-2xl border',
        TONES[tone],
        padded && 'p-5 sm:p-6',
        interactive && 'transition-all duration-300 hover:border-gray-200 hover:shadow-card-hover',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  accent: 'bg-accent-100 text-accent-700 border-accent-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-100',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-sky-100 text-sky-700 border-sky-200',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export function Badge({ tone = 'neutral', size = 'sm', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        BADGE_TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export type AlertTone = 'success' | 'warning' | 'danger' | 'info';

const ALERT_TONES: Record<AlertTone, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-primary-50 border-primary-100 text-primary-800',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  icon?: React.ReactNode;
  title?: string;
}

export function Alert({
  tone = 'info',
  icon,
  title,
  className,
  children,
  ...rest
}: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in',
        ALERT_TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 text-[13px] opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('relative overflow-hidden rounded-xl bg-gray-100', className)}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export interface SectionHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  align = 'left',
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-8 gap-4',
        actions ? 'flex items-end justify-between' : 'block',
        align === 'center' && !actions && 'text-center',
        className,
      )}
    >
      <div className={cn(align === 'center' && !actions && 'mx-auto max-w-2xl')}>
        <h2 className="text-xl font-bold text-gray-900 text-balance sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-12 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {icon}
        </div>
      )}
      <p className="font-semibold text-gray-700">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
