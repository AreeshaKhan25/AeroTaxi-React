/**
 * Row shapes as stored in SQLite (snake_case) and the camelCase DTOs that the
 * API returns. Keeping the two separate means the database can keep the
 * original Laravel column names while the React app speaks idiomatic JS.
 */

export interface AirportRow {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  description: string;
  image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleRow {
  id: number;
  name: string;
  slug: string;
  price: number;
  short_base: number;
  short_per_mile: number;
  long_base: number;
  long_per_mile: number;
  passengers: number;
  suitcases: number;
  hand_luggage_note: string | null;
  image: string;
  description: string | null;
  car_model: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FaqRow {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: number;
  reference: string;
  from_location: string;
  to_location: string;
  depart_date: string;
  depart_time: string | null;
  vehicle_id: number;
  passenger_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  flight_number: string | null;
  note_to_driver: string | null;
  passengers: number;
  suitcases: number;
  hand_luggage: number;
  extras: string;
  distance: string | null;
  duration: string | null;
  status: string;
  payment_status: string;
  payment_id: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessageRow {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriberRow {
  id: number;
  email: string;
  name: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRow {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: number;
  type: string;
  message: string;
  data: string | null;
  read: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionRow {
  id: number;
  subject: string;
  message: string;
  recipient_count: number;
  sent_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ZoneRow {
  id: number;
  name: string;
  colour: string;
  geometry: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ DTOs */

export interface AirportDto {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface VehicleDto {
  id: number;
  name: string;
  slug: string;
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

export interface FaqDto {
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

export interface BookingDto {
  id: number;
  reference: string;
  fromLocation: string;
  toLocation: string;
  departDate: string;
  departTime: string | null;
  vehicleId: number;
  vehicle: VehicleDto | null;
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
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageDto {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SubscriberDto {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
}

export interface NotificationDto {
  id: number;
  type: string;
  message: string;
  data: unknown;
  read: boolean;
  createdAt: string;
}

export interface PromotionDto {
  id: number;
  subject: string;
  message: string;
  recipientCount: number;
  sentCount: number;
  status: string;
  createdAt: string;
}

export interface ZoneDto {
  id: number;
  name: string;
  colour: string;
  geometry: [number, number][];
  createdAt: string;
}
