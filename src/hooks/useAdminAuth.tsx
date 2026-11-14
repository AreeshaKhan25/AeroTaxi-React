import { createContext, useCallback, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { AdminIdentity } from '@/types';

interface AdminAuthValue {
  admin: AdminIdentity | null;
  /** True until the session cookie has been checked once. */
  loading: boolean;
  login: (credentials: { email: string; password: string; remember: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  loggingIn: boolean;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export const ADMIN_SESSION_KEY = ['admin', 'me'] as const;

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const session = useQuery({
    queryKey: ADMIN_SESSION_KEY,
    queryFn: () => adminApi.me(),
    retry: false,
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: adminApi.login,
    onSuccess: (result) => {
      queryClient.setQueryData(ADMIN_SESSION_KEY, { admin: result.admin });
    },
  });

  const login = useCallback(
    async (credentials: { email: string; password: string; remember: boolean }) => {
      await loginMutation.mutateAsync(credentials);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      queryClient.setQueryData(ADMIN_SESSION_KEY, { admin: null });
      /* Drop every cached admin response so the next sign-in starts clean. */
      queryClient.removeQueries({ queryKey: ['admin'], exact: false });
    }
  }, [queryClient]);

  const value = useMemo<AdminAuthValue>(
    () => ({
      admin: session.data?.admin ?? null,
      loading: session.isLoading,
      login,
      logout,
      loggingIn: loginMutation.isPending,
    }),
    [session.data?.admin, session.isLoading, login, logout, loginMutation.isPending],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside an <AdminAuthProvider>');
  }
  return context;
}
