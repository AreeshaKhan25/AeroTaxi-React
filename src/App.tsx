import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout, { RequireAdmin } from '@/components/admin/AdminLayout';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { ToastProvider } from '@/components/ui/Toast';
import { AdminAuthProvider } from '@/hooks/useAdminAuth';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  COOKIE_POLICY,
  PRIVACY_POLICY,
  PRIVACY_STATEMENT,
  TERMS_OF_SERVICE,
} from '@/content/legal';
import { ApiError } from '@/lib/api';
import { ROUTES } from '@/lib/site';

/* Route-level code splitting keeps the first paint light. */
const HomePage = lazy(() => import('@/pages/HomePage'));
const CoveragePage = lazy(() => import('@/pages/CoveragePage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const YourRidePage = lazy(() => import('@/pages/booking/YourRidePage'));
const TransferDetailsPage = lazy(() => import('@/pages/booking/TransferDetailsPage'));
const PaymentPage = lazy(() => import('@/pages/booking/PaymentPage'));
const ConfirmationPage = lazy(() => import('@/pages/booking/ConfirmationPage'));
const BookingLookupPage = lazy(() => import('@/pages/booking/BookingLookupPage'));
const LegalDocumentPage = lazy(() => import('@/pages/legal/LegalDocumentPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminJobsPage = lazy(() => import('@/pages/admin/AdminJobsPage'));
const AdminUnpaidPage = lazy(() => import('@/pages/admin/AdminUnpaidPage'));
const AdminBookingDetailPage = lazy(() => import('@/pages/admin/AdminBookingDetailPage'));
const AdminFleetPage = lazy(() => import('@/pages/admin/AdminFleetPage'));
const AdminZonesPage = lazy(() => import('@/pages/admin/AdminZonesPage'));
const AdminMessagesPage = lazy(() => import('@/pages/admin/AdminMessagesPage'));
const AdminPromotionsPage = lazy(() => import('@/pages/admin/AdminPromotionsPage'));
const AdminSubscribersPage = lazy(() => import('@/pages/admin/AdminSubscribersPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        /* Never retry a request the server already answered deliberately. */
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-700"
        aria-hidden
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public site */}
                <Route element={<SiteLayout />}>
                  <Route path={ROUTES.home} element={<HomePage />} />
                  <Route path={ROUTES.coverage} element={<CoveragePage />} />
                  <Route path={ROUTES.help} element={<HelpPage />} />
                  <Route path={ROUTES.yourRide} element={<YourRidePage />} />
                  <Route path={ROUTES.transferDetails} element={<TransferDetailsPage />} />
                  <Route path={ROUTES.payment} element={<PaymentPage />} />
                  <Route path="/booking/confirmation/:reference" element={<ConfirmationPage />} />
                  <Route path={ROUTES.lookup} element={<BookingLookupPage />} />

                  <Route
                    path={ROUTES.terms}
                    element={<LegalDocumentPage doc={TERMS_OF_SERVICE} />}
                  />
                  <Route
                    path={ROUTES.privacyPolicy}
                    element={<LegalDocumentPage doc={PRIVACY_POLICY} />}
                  />
                  <Route
                    path={ROUTES.privacyStatement}
                    element={<LegalDocumentPage doc={PRIVACY_STATEMENT} />}
                  />
                  <Route
                    path={ROUTES.cookiePolicy}
                    element={<LegalDocumentPage doc={COOKIE_POLICY} />}
                  />

                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Admin panel */}
                <Route
                  path={ROUTES.admin.login}
                  element={
                    <AdminAuthProvider>
                      <AdminLoginPage />
                    </AdminAuthProvider>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminAuthProvider>
                      <RequireAdmin>
                        <AdminLayout />
                      </RequireAdmin>
                    </AdminAuthProvider>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="jobs" element={<AdminJobsPage />} />
                  <Route path="bookings" element={<AdminUnpaidPage />} />
                  <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
                  <Route path="fleet" element={<AdminFleetPage />} />
                  <Route path="zones-map" element={<AdminZonesPage />} />
                  <Route path="contact-messages" element={<AdminMessagesPage />} />
                  <Route path="promotions" element={<AdminPromotionsPage />} />
                  <Route path="subscribers" element={<AdminSubscribersPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
