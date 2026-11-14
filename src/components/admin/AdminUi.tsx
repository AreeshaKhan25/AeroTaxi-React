import { cn } from '@/lib/cn';
import { titleCase } from '@/lib/format';

/* ------------------------------------------------------------------ cards */

export function AdminCard({
  title,
  actions,
  children,
  bodyClassName,
  className,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          {typeof title === 'string' ? (
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          ) : (
            title
          )}
          {actions}
        </header>
      )}
      <div className={cn('p-6', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: 'primary' | 'success' | 'info' | 'warning';
}) {
  const tones = {
    primary: { bg: 'bg-primary-50', fg: 'text-primary-700', value: 'text-gray-900' },
    success: { bg: 'bg-green-50', fg: 'text-green-600', value: 'text-green-600' },
    info: { bg: 'bg-sky-50', fg: 'text-sky-600', value: 'text-sky-600' },
    warning: { bg: 'bg-amber-50', fg: 'text-amber-600', value: 'text-amber-600' },
  }[tone];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-gray-500">{label}</p>
          <p className={cn('truncate text-3xl font-bold', tones.value)}>{value}</p>
        </div>
        <span
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
            tones.bg,
            tones.fg,
          )}
          aria-hidden
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- badges */

const STATUS_TONES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  bidding: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  assigned: 'bg-sky-100 text-sky-700',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = status || 'new';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        STATUS_TONES[value] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {titleCase(value)}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string | null | undefined }) {
  const value = status || 'unpaid';
  const tone =
    value === 'paid'
      ? 'bg-green-100 text-green-700'
      : value === 'refunded'
        ? 'bg-gray-200 text-gray-700'
        : 'bg-amber-100 text-amber-700';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', tone)}>
      {titleCase(value)}
    </span>
  );
}

/* ------------------------------------------------------------------ table */

export function TableShell({
  head,
  children,
  empty,
  isEmpty,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  empty?: React.ReactNode;
  isEmpty?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            {head}
          </thead>
          <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
      </div>
      {isEmpty && (
        <div className="px-6 py-10 text-center text-sm text-gray-400">{empty ?? 'Nothing here yet.'}</div>
      )}
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={cn('px-5 py-3.5 text-left font-medium', className)}>{children}</th>;
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn('px-5 py-4 align-middle', className)}>{children}</td>;
}

/* ----------------------------------------------------------------- inputs */

const CONTROL =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50';

export function AdminField({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export function AdminInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function AdminSelect({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function AdminTextarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'resize-y', className)} {...rest} />;
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}) {
  const variants = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800',
    ghost: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm' };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ misc */

export function PageTitle({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
        {meta && <p className="mt-0.5 text-sm text-gray-500">{meta}</p>}
      </div>
      {actions}
    </div>
  );
}

export function AdminSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-700"
        aria-hidden
      />
      {label}
    </div>
  );
}

export function AdminError({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message ?? 'Something went wrong while loading this page.'}
    </div>
  );
}
