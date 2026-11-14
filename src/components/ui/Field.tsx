import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

/** Label + control + error message, wired up with the right aria attributes. */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldWrapperProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-gray-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Rendered inside the field on the left, typically a 16px icon. */
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leadingIcon, trailing, ...rest },
  ref,
) {
  const control = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'field',
        invalid && 'field-error',
        leadingIcon && 'pl-10',
        trailing && 'pr-10',
        className,
      )}
      {...rest}
    />
  );

  if (!leadingIcon && !trailing) return control;

  return (
    <div className="relative">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {leadingIcon}
        </span>
      )}
      {control}
      {trailing && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{trailing}</span>
      )}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn('field resize-none', invalid && 'field-error', className)}
      {...rest}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'field cursor-pointer appearance-none pr-10',
          invalid && 'field-error',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 fill-gray-400"
      >
        <path d="M6 8L1 3h10z" />
      </svg>
    </div>
  );
});

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { children, className, ...rest },
  ref,
) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-accent-500 focus:ring-accent"
        {...rest}
      />
      <span className="text-sm leading-relaxed text-gray-600">{children}</span>
    </label>
  );
});
