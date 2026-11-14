import type {
  AirportDto,
  AirportRow,
  BookingDto,
  BookingExtra,
  BookingRow,
  ContactMessageDto,
  ContactMessageRow,
  FaqDto,
  FaqRow,
  NotificationDto,
  NotificationRow,
  PromotionDto,
  PromotionRow,
  SubscriberDto,
  SubscriberRow,
  VehicleDto,
  VehicleRow,
  ZoneDto,
  ZoneRow,
} from './types.js';

const money = (value: number | null | undefined): number =>
  Math.round((Number(value) || 0) * 100) / 100;

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const toAirport = (row: AirportRow): AirportDto => ({
  id: row.id,
  code: row.code,
  name: row.name,
  city: row.city,
  country: row.country,
  description: row.description,
  image: row.image,
  sortOrder: row.sort_order,
});

export const toVehicle = (row: VehicleRow): VehicleDto => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  price: money(row.price),
  shortBase: money(row.short_base),
  shortPerMile: money(row.short_per_mile),
  longBase: money(row.long_base),
  longPerMile: money(row.long_per_mile),
  passengers: row.passengers,
  suitcases: row.suitcases,
  handLuggageNote: row.hand_luggage_note,
  image: row.image,
  description: row.description,
  carModel: row.car_model,
  sortOrder: row.sort_order,
});

export const toFaq = (row: FaqRow): FaqDto => ({
  id: row.id,
  question: row.question,
  answer: row.answer,
  sortOrder: row.sort_order,
});

export type BookingRowWithVehicle = BookingRow & {
  vehicle?: VehicleRow | null;
};

export const toBooking = (row: BookingRow, vehicle?: VehicleRow | null): BookingDto => ({
  id: row.id,
  reference: row.reference,
  fromLocation: row.from_location,
  toLocation: row.to_location,
  departDate: row.depart_date,
  departTime: row.depart_time,
  vehicleId: row.vehicle_id,
  vehicle: vehicle ? toVehicle(vehicle) : null,
  passengerName: row.passenger_name,
  email: row.email,
  phone: row.phone,
  countryCode: row.country_code,
  flightNumber: row.flight_number,
  noteToDriver: row.note_to_driver,
  passengers: row.passengers,
  suitcases: row.suitcases,
  handLuggage: row.hand_luggage,
  extras: parseJson<BookingExtra[]>(row.extras, []),
  distance: row.distance,
  duration: row.duration,
  status: row.status,
  paymentStatus: row.payment_status,
  paymentId: row.payment_id,
  totalPrice: money(row.total_price),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toContactMessage = (row: ContactMessageRow): ContactMessageDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  subject: row.subject,
  message: row.message,
  read: Boolean(row.read),
  createdAt: row.created_at,
});

export const toSubscriber = (row: SubscriberRow): SubscriberDto => ({
  id: row.id,
  email: row.email,
  name: row.name,
  active: Boolean(row.active),
  createdAt: row.created_at,
});

export const toNotification = (row: NotificationRow): NotificationDto => ({
  id: row.id,
  type: row.type,
  message: row.message,
  data: parseJson<unknown>(row.data, null),
  read: Boolean(row.read),
  createdAt: row.created_at,
});

export const toPromotion = (row: PromotionRow): PromotionDto => ({
  id: row.id,
  subject: row.subject,
  message: row.message,
  recipientCount: row.recipient_count,
  sentCount: row.sent_count,
  status: row.status,
  createdAt: row.created_at,
});

export const toZone = (row: ZoneRow): ZoneDto => ({
  id: row.id,
  name: row.name,
  colour: row.colour,
  geometry: parseJson<[number, number][]>(row.geometry, []),
  createdAt: row.created_at,
});
