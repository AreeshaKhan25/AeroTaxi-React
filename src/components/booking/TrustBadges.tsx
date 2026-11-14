import { CircleCheck, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

const BADGES = [
  {
    icon: Lock,
    title: 'Your data is encrypted',
    description: 'Payments are 100% PCI compliant',
  },
  {
    icon: RotateCcw,
    title: 'Get a 100% refund',
    description: 'If you cancel 24 hours before your transfer.',
  },
  {
    icon: CircleCheck,
    title: 'Receive confirmation',
    description: 'Directly after hitting confirm payment.',
  },
] as const;

export function TrustBadges({ className }: { className?: string }) {
  return (
    <ul className={cn('grid grid-cols-3 gap-4 text-center', className)}>
      {BADGES.map(({ icon: Icon, title, description }) => (
        <li key={title}>
          <Icon className="mx-auto mb-2 h-5 w-5 text-gray-400" aria-hidden />
          <p className="text-xs font-semibold text-gray-700">{title}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-gray-400">{description}</p>
        </li>
      ))}
    </ul>
  );
}

export function RefundBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50 p-5',
        className,
      )}
    >
      <div className="flex-1">
        <h3 className="mb-1 font-bold text-gray-900">Need to adjust? We&rsquo;ve got you!</h3>
        <p className="text-sm text-gray-600">
          Get a 100% refund if you cancel 24 hours before your transfer, or easily change your
          booking if your plans shift.
        </p>
      </div>
      <div className="flex-shrink-0 text-4xl" aria-hidden>
        🧳
      </div>
    </div>
  );
}
