import { useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Briefcase,
  CarFront,
  ChartPie,
  Clock,
  LogOut,
  Mail,
  Map,
  Megaphone,
  Menu,
  UserCircle,
  UserPlus,
  X,
} from 'lucide-react';
import { AdminSpinner } from '@/components/admin/AdminUi';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useClickOutside } from '@/hooks/useClickOutside';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/format';
import { ROUTES } from '@/lib/site';
import type { AdminNotification } from '@/types';

const NAV = [
  { to: ROUTES.admin.dashboard, label: 'Dashboard', icon: ChartPie, end: true },
  { to: ROUTES.admin.jobs, label: 'Jobs', icon: Briefcase, end: false },
  { to: ROUTES.admin.unpaid, label: 'Unpaid', icon: Clock, end: true },
  { to: ROUTES.admin.fleet, label: 'Fleet', icon: CarFront, end: false },
  { to: ROUTES.admin.zones, label: 'Zones Map', icon: Map, end: false },
  { to: ROUTES.admin.messages, label: 'Messages', icon: Mail, end: false },
  { to: ROUTES.admin.promotions, label: 'Promotions', icon: Megaphone, end: false },
] as const;

/** Redirects to the login screen, remembering where the admin was headed. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <AdminSpinner label="Checking your session…" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to={ROUTES.admin.login} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function NotificationIcon({ type }: { type: AdminNotification['type'] }) {
  if (type === 'booking') return <Briefcase className="mt-0.5 h-4 w-4 text-primary-600" aria-hidden />;
  if (type === 'contact') return <Mail className="mt-0.5 h-4 w-4 text-green-600" aria-hidden />;
  if (type === 'subscriber') return <UserPlus className="mt-0.5 h-4 w-4 text-purple-600" aria-hidden />;
  return <Bell className="mt-0.5 h-4 w-4 text-gray-400" aria-hidden />;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useClickOutside(panelRef, () => setOpen(false), open);

  const notifications = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminApi.notifications(15),
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: adminApi.markNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] });
    },
  });

  const unread = notifications.data?.unreadCount ?? 0;
  const items = notifications.data?.notifications ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-1.5 text-primary-100 transition hover:bg-white/10 hover:text-white"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right animate-slide-down overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead.mutate()}
                className="text-xs font-medium text-primary-700 hover:underline disabled:opacity-50"
                disabled={markRead.isPending}
              >
                Mark all read
              </button>
            )}
          </header>

          <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                {notifications.isLoading ? 'Loading…' : 'No notifications yet.'}
              </p>
            )}
            {items.map((notification) => (
              <div
                key={notification.id}
                className={cn('px-4 py-3 text-sm hover:bg-gray-50', !notification.read && 'bg-primary-50/60')}
              >
                <div className="flex items-start gap-2">
                  <NotificationIcon type={notification.type} />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug text-gray-800">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" aria-hidden />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
      isActive
        ? 'bg-primary-600 text-white shadow'
        : 'text-primary-100 hover:bg-white/10 hover:text-white',
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="sticky top-0 z-50 bg-primary-950 shadow-lg">
        <div className="px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              to={ROUTES.admin.dashboard}
              className="flex flex-shrink-0 items-center gap-3"
              onClick={() => setMobileOpen(false)}
            >
              <img src="/images/logo.png" alt="AeroTAXI" className="h-9 w-auto" />
              <span className="text-lg font-bold text-white">Admin</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={navClasses}>
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-sm text-primary-100 sm:flex">
                <UserCircle className="h-4 w-4" aria-hidden /> {admin?.name ?? 'Admin'}
              </span>

              <NotificationBell />

              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg p-1.5 text-primary-200 transition hover:bg-white/10 hover:text-red-400"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="rounded-lg p-1.5 text-primary-100 transition hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="animate-slide-down space-y-1 border-t border-white/10 px-4 py-3 md:hidden">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-4 py-3 text-base font-medium',
                    isActive ? 'bg-primary-600 text-white' : 'text-primary-100 hover:bg-white/10',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
