import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SITE } from '@/lib/site';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * A stale chunk reference is the common one: a visitor keeps a tab open across
 * a deploy, navigates, and the hashed bundle that route needs is gone. Reloading
 * fixes that but not a genuine render crash, so the two cases are told apart and
 * worded differently.
 */
const isStaleChunk = (error: Error): boolean =>
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    `${error.name} ${error.message}`,
  );

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ui] render failed:', error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stale = isStaleChunk(error);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-16 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
            <AlertTriangle className="h-7 w-7 text-accent-600" aria-hidden />
          </div>

          <h1 className="mb-2 text-xl font-bold text-gray-900">
            {stale ? 'A new version is available' : 'Something went wrong'}
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            {stale
              ? 'This page was updated while your tab was open. Reload to pick up the latest version.'
              : 'An unexpected error stopped this page from loading. Reloading usually clears it.'}
          </p>

          <Button type="button" onClick={this.reload} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Reload the page
          </Button>

          {!stale && (
            <p className="mt-5 text-xs text-gray-500">
              Still stuck? Email{' '}
              <a
                className="font-medium text-primary underline underline-offset-2"
                href={`mailto:${SITE.supportEmail}`}
              >
                {SITE.supportEmail}
              </a>
              .
            </p>
          )}
        </div>
      </div>
    );
  }
}
