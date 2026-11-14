import type {
  AdminIdentity,
  AdminNotification,
  Airport,
  AppConfig,
  Booking,
  BookingStats,
  ContactMessage,
  Faq,
  FleetVehicle,
  FlightLookupResult,
  Promotion,
  Subscriber,
  Vehicle,
  Zone,
} from '@/types';

const BASE = '/api';

/** An error carrying the HTTP status and any per-field validation messages. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string>;
  readonly payload: unknown;

  constructor(status: number, message: string, errors: Record<string, string> = {}, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.payload = payload;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;

  const response = await fetch(buildUrl(path, query), {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...rest,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const data = (payload ?? {}) as { message?: string; errors?: Record<string, string> };
    throw new ApiError(
      response.status,
      data.message ?? `Request failed with status ${response.status}`,
      data.errors ?? {},
      payload,
    );
  }

  return payload as T;
}

/* ------------------------------------------------------------ public API */

export interface CreateBookingPayload {
  fromLocation: string;
  toLocation: string;
  departDate: string;
  departTime: string | null;
  vehicleId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string | null;
  flightNumber: string | null;
  noteToDriver: string | null;
  passengers: number;
  suitcases: number;
  handLuggage: number;
  extras: { id: string; label: string; price: number }[];
  distance: string | null;
  duration: string | null;
  totalPrice: number;
  agreePromotions: boolean;
}

export const api = {
  config: () => request<AppConfig>('/config'),

  airports: (query?: string) =>
    request<Airport[]>('/airports', { query: query ? { q: query } : undefined }),

  searchAirports: (query: string, limit = 6) =>
    request<Airport[]>('/airports', { query: { q: query, limit } }),

  vehicles: () => request<Vehicle[]>('/vehicles'),

  faqs: () => request<Faq[]>('/faqs'),

  validateFlight: (flightNumber: string, date?: string) =>
    request<FlightLookupResult>('/flights/validate', { query: { flightNumber, date } }),

  createBooking: (payload: CreateBookingPayload) =>
    request<Booking>('/bookings', { method: 'POST', body: payload }),

  booking: (reference: string) => request<Booking>(`/bookings/${encodeURIComponent(reference)}`),

  lookupBooking: (reference: string) =>
    request<{ reference: string; booking: Booking | null }>('/bookings/lookup', {
      query: { reference },
    }),

  paymentIntent: (reference: string) =>
    request<{ demo: boolean; clientSecret: string | null; alreadyPaid?: boolean }>(
      `/bookings/${encodeURIComponent(reference)}/payment-intent`,
      { method: 'POST' },
    ),

  confirmBooking: (reference: string, paymentIntentId?: string) =>
    request<{ booking: Booking; alreadyConfirmed: boolean }>(
      `/bookings/${encodeURIComponent(reference)}/confirm`,
      { method: 'POST', body: { paymentIntentId } },
    ),

  sendContactMessage: (payload: {
    name: string;
    email: string;
    subject: string | null;
    message: string;
  }) => request<{ message: string }>('/contact', { method: 'POST', body: payload }),

  subscribe: (payload: { email: string; name?: string | null }) =>
    request<{ message: string; created: boolean }>('/subscribers', { method: 'POST', body: payload }),
};

/* ------------------------------------------------------------- admin API */

export interface AdminBookingPayload {
  fromLocation: string;
  toLocation: string;
  departDate: string;
  departTime: string | null;
  vehicleId: number;
  passengerName: string;
  email: string;
  phone: string | null;
  countryCode: string | null;
  flightNumber: string | null;
  noteToDriver: string | null;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  totalPrice: number;
}

export const adminApi = {
  login: (payload: { email: string; password: string; remember: boolean }) =>
    request<{ admin: AdminIdentity }>('/admin/login', { method: 'POST', body: payload }),

  logout: () => request<{ message: string }>('/admin/logout', { method: 'POST' }),

  me: () => request<{ admin: AdminIdentity | null }>('/admin/me'),

  stats: () => request<BookingStats>('/admin/stats'),

  summary: () => request<{ unreadNotifications: number; unreadMessages: number }>('/admin/summary'),

  bookings: (scope: 'all' | 'unpaid' = 'all') =>
    request<Booking[]>('/admin/bookings', { query: { scope } }),

  booking: (id: number) => request<Booking>(`/admin/bookings/${id}`),

  updateBooking: (id: number, payload: AdminBookingPayload) =>
    request<{ message: string; booking: Booking }>(`/admin/bookings/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  fleet: () => request<FleetVehicle[]>('/admin/fleet'),

  contactMessages: () => request<ContactMessage[]>('/admin/contact-messages'),

  markMessageRead: (id: number, read = true) =>
    request<{ message: string; contactMessage: ContactMessage }>(`/admin/contact-messages/${id}`, {
      method: 'PATCH',
      body: { read },
    }),

  subscribers: () => request<Subscriber[]>('/admin/subscribers'),

  setSubscriberActive: (id: number, active: boolean) =>
    request<{ subscriber: Subscriber }>(`/admin/subscribers/${id}`, {
      method: 'PATCH',
      body: { active },
    }),

  promotions: () =>
    request<{ promotions: Promotion[]; subscribers: Subscriber[]; activeSubscribers: number }>(
      '/admin/promotions',
    ),

  sendPromotion: (payload: { subject: string; message: string }) =>
    request<{ message: string; promotion: Promotion }>('/admin/promotions', {
      method: 'POST',
      body: payload,
    }),

  notifications: (limit = 25) =>
    request<{ notifications: AdminNotification[]; unreadCount: number }>('/admin/notifications', {
      query: { limit },
    }),

  markNotificationsRead: () =>
    request<{ unreadCount: number }>('/admin/notifications/mark-read', { method: 'POST' }),

  zones: () => request<Zone[]>('/admin/zones'),

  createZone: (payload: { name: string; colour: string; geometry: [number, number][] }) =>
    request<Zone>('/admin/zones', { method: 'POST', body: payload }),

  deleteZone: (id: number) => request<{ message: string }>(`/admin/zones/${id}`, { method: 'DELETE' }),
};
