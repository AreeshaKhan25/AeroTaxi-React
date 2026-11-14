import { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'dark'
  | 'danger'
  | 'admin';

export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] whitespace-nowrap';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent-500 hover:shadow-md',
  secondary: 'bg-lightgreen text-ink hover:bg-green-200',
  outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  dark: 'bg-ink text-white hover:bg-gray-800 hover:shadow-md',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  admin: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3.5 py-2 text-xs',
  md: 'rounded-xl px-6 py-3 text-sm',
  lg: 'rounded-xl px-8 py-4 text-base',
};

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export const buttonClasses = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonBaseProps & { className?: string }): string =>
  cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonBaseProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading = false, fullWidth, className, children, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps, ButtonBaseProps {}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}

export interface ButtonAnchorProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    ButtonBaseProps {}

export function ButtonAnchor({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonAnchorProps) {
  return (
    <a className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </a>
  );
}

/** Circular icon button used by the carousels and counters. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'outline' | 'accent' | 'ghost';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = 'outline', className, children, type, ...rest },
  ref,
) {
  const tones: Record<NonNullable<IconButtonProps['tone']>, string> = {
    outline:
      'border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 hover:shadow-sm',
    accent: 'bg-accent text-ink hover:bg-accent-500 shadow-sm',
    ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
  };

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all',
        'disabled:cursor-not-allowed disabled:opacity-30',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
