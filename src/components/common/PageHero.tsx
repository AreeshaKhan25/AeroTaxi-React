import { cn } from '@/lib/cn';

interface PageHeroProps {
  title: string;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'cream' | 'white';
  children?: React.ReactNode;
  className?: string;
}

export function PageHero({
  title,
  subtitle,
  align = 'left',
  tone = 'cream',
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn('py-12 lg:py-16', tone === 'cream' ? 'bg-cream' : 'bg-white', className)}
    >
      <div
        className={cn(
          'container-page',
          align === 'center' && 'text-center',
        )}
      >
        <h1 className="text-3xl font-bold text-gray-900 text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              'mt-3 text-base text-gray-500 sm:text-lg',
              align === 'center' && 'mx-auto max-w-2xl',
            )}
          >
            {subtitle}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
