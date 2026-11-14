import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError } from '@/lib/api';
import { ROUTES } from '@/lib/site';

interface LocationState {
  from?: { pathname?: string };
}

export default function AdminLoginPage() {
  usePageTitle('Admin sign in');
  const { admin, loading, login, loggingIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const target = (location.state as LocationState | null)?.from?.pathname ?? ROUTES.admin.dashboard;

  if (!loading && admin) {
    return <Navigate to={target} replace />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    try {
      await login({ email: email.trim(), password, remember });
      navigate(target, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors);
        setMessage(Object.keys(error.errors).length === 0 ? error.message : null);
        return;
      }
      setMessage('We could not sign you in. Please try again.');
    }
  };

  const inputClasses =
    'w-full rounded-lg border border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-500 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-gray-800 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <img src="/images/logo.png" alt="AeroTAXI" className="mx-auto mb-3 h-14 w-auto" />
            <p className="text-sm text-gray-400">Admin Panel</p>
          </div>

          {(message || Object.keys(errors).length > 0) && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400"
            >
              {message && <p>{message}</p>}
              {Object.entries(errors).map(([field, text]) => (
                <p key={field}>{text}</p>
              ))}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <div className="mb-5">
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@aerotaxi.com"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock className="h-4 w-4" aria-hidden />
                </span>
                <input
                  id="admin-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className={inputClasses}
                />
              </div>
            </div>

            <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-accent focus:ring-accent focus:ring-offset-gray-800"
              />
              Remember me for 30 days
            </label>

            <button
              type="submit"
              disabled={loggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-bold text-gray-900 transition duration-200 hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingIn ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"
                  aria-hidden
                />
              ) : (
                <LogIn className="h-4 w-4" aria-hidden />
              )}
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} AeroTAXI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
