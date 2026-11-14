import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { wrapper: string; icon: React.ReactNode }> = {
  success: {
    wrapper: 'border-green-200 bg-white',
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />,
  },
  error: {
    wrapper: 'border-red-200 bg-white',
    icon: <XCircle className="h-5 w-5 text-red-600" aria-hidden />,
  },
  warning: {
    wrapper: 'border-amber-200 bg-white',
    icon: <TriangleAlert className="h-5 w-5 text-amber-600" aria-hidden />,
  },
  info: {
    wrapper: 'border-primary-100 bg-white',
    icon: <Info className="h-5 w-5 text-primary-600" aria-hidden />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'error', title, description }),
      info: (title, description) => push({ tone: 'info', title, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[1000] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-card-hover animate-fade-in-up',
              TONE_STYLES[toast.tone].wrapper,
            )}
          >
            <span className="mt-0.5 flex-shrink-0">{TONE_STYLES[toast.tone].icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-m-1 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
