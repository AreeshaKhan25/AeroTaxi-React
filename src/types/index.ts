export interface Airport {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface Vehicle {
  id: number;
  name: string;
  slug: VehicleSlug | string;
  price: number;
  shortBase: number;
  shortPerMile: number;
  longBase: number;
  longPerMile: number;
  passengers: number;
  suitcases: number;
  handLuggageNote: string | null;
  image: string;
  description: string | null;
  carModel: string | null;
  sortOrder: number;
}

export type VehicleSlug =
  | 'saloon'
  | 'estate'
  | 'executive'
  | 'people-carrier'
  | 'executive-people-carrier'
  | 'minibus'
  | '16pax';

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface BookingExtra {
  id: string;
  label: string;
  price: number;
}

export type BookingStatus =
  | 'new'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'assigned'
  | 'bidding';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Booking {
  id: number;
  reference: string;
  fromLocation: string;
  toLocation: string;
  departDate: string;
  departTime: string | null;
  vehicleId: number;
  vehicle: Vehicle | null;
  passengerName: string | null;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  flightNumber: string | null;
  noteToDriver: string | null;
  passengers: number;
  suitcases: number;
  handLuggage: number;
  extras: BookingExtra[];
  distance: string | null;
  duration: string | null;
  status: BookingStatus | string;
  paymentStatus: PaymentStatus | string;
  paymentId: string | null;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface FleetVehicle extends Vehicle {
  bookingCount: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
}

export interface AdminNotification {
  id: number;
  type: 'booking' | 'contact' | 'subscriber' | 'system' | string;
  message: string;
  data: unknown;
  read: boolean;
  createdAt: string;
}

export interface Promotion {
  id: number;
  subject: string;
  message: string;
  recipientCount: number;
  sentCount: number;
  status: string;
  createdAt: string;
}

export interface Zone {
  id: number;
  name: string;
  colour: string;
  geometry: [number, number][];
  createdAt: string;
}

export interface AdminIdentity {
  id: number;
  name: string;
  email: string;
}

export interface AppConfig {
  stripePublishableKey: string | null;
  stripeEnabled: boolean;
  mailEnabled: boolean;
  supportEmail: string;
  appUrl: string;
}

export interface FlightLookupResult {
  found: boolean;
  source?: 'aviationstack' | 'airline-directory';
  info?: string;
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  scheduledDeparture?: string | null;
  status?: string | null;
  reason?: 'missing' | 'invalid-format' | 'not-found' | 'unknown-airline';
}

export interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  pendingBookings: number;
  byStatus: { status: string; count: number }[];
  byVehicle: { name: string; count: number }[];
  revenueByDay: { day: string; bookings: number; revenue: number }[];
  subscribers: Subscriber[];
  activeSubscribers: number;
  unreadMessages: number;
  recentBookings: Booking[];
}

/** A place suggestion, either one of our airports or an OSM address. */
export interface PlaceSuggestion {
  kind: 'airport' | 'address';
  /** Value written into the input when chosen. */
  value: string;
  label: string;
  sublabel?: string;
  code?: string;
  lat?: number;
  lon?: number;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface RouteResult {
  /** Charged distance in miles (includes the standard local-roads allowance). */
  miles: number;
  distanceLabel: string;
  durationLabel: string;
  durationSeconds: number;
  geometry: [number, number][];
  from: Coordinates;
  to: Coordinates;
  /** True when OSRM could not be reached and a straight line is shown. */
  approximate: boolean;
}
