import { db, nowIso } from './db.js';
import {
  toAirport,
  toBooking,
  toContactMessage,
  toFaq,
  toNotification,
  toPromotion,
  toSubscriber,
  toVehicle,
  toZone,
} from './mappers.js';
import type {
  AdminRow,
  AirportDto,
  AirportRow,
  BookingDto,
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

/* ------------------------------------------------------------- reference */

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** `ATH-XXXXXXXX`, matching the original Laravel reference format. */
export function generateReference(): string {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let suffix = '';
    for (let i = 0; i < 8; i += 1) {
      suffix += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
    }
    const reference = `ATH-${suffix}`;
    const existing = db
      .prepare('SELECT 1 AS hit FROM bookings WHERE reference = ?')
      .get(reference) as { hit: number } | undefined;
    if (!existing) return reference;
  }
  return `ATH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

/* -------------------------------------------------------------- airports */

export const airports = {
  all(): AirportDto[] {
    const rows = db
      .prepare('SELECT * FROM airports ORDER BY sort_order ASC')
      .all() as AirportRow[];
    return rows.map(toAirport);
  },

  search(query: string, limit = 10): AirportDto[] {
    const trimmed = query.trim();
    if (!trimmed) {
      const rows = db
        .prepare('SELECT * FROM airports ORDER BY sort_order ASC LIMIT ?')
        .all(limit) as AirportRow[];
      return rows.map(toAirport);
    }
    const like = `%${trimmed}%`;
    const rows = db
      .prepare(
        `SELECT * FROM airports
         WHERE name LIKE ? COLLATE NOCASE
            OR code LIKE ? COLLATE NOCASE
            OR city LIKE ? COLLATE NOCASE
         ORDER BY sort_order ASC
         LIMIT ?`,
      )
      .all(like, like, like, limit) as AirportRow[];
    return rows.map(toAirport);
  },
};

/* -------------------------------------------------------------- vehicles */

export const vehicles = {
  all(): VehicleDto[] {
    const rows = db
      .prepare('SELECT * FROM vehicles ORDER BY sort_order ASC')
      .all() as VehicleRow[];
    return rows.map(toVehicle);
  },

  findRow(id: number): VehicleRow | undefined {
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as VehicleRow | undefined;
  },

  find(id: number): VehicleDto | undefined {
    const row = vehicles.findRow(id);
    return row ? toVehicle(row) : undefined;
  },
};

/* ------------------------------------------------------------------ faqs */

export const faqs = {
  all(): FaqDto[] {
    const rows = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all() as FaqRow[];
    return rows.map(toFaq);
  },
};

/* -------------------------------------------------------------- bookings */

export interface CreateBookingInput {
  fromLocation: string;
  toLocation: string;
  departDate: string;
  departTime: string | null;
  vehicleId: number;
  passengerName: string;
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
}

export interface UpdateBookingInput {
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

const bookingWithVehicle = (row: BookingRow): BookingDto =>
  toBooking(row, vehicles.findRow(row.vehicle_id) ?? null);

export const bookings = {
  create(input: CreateBookingInput): BookingDto {
    const reference = generateReference();
    const timestamp = nowIso();

    const result = db
      .prepare(
        `INSERT INTO bookings (
            reference, from_location, to_location, depart_date, depart_time, vehicle_id,
            passenger_name, email, phone, country_code, flight_number, note_to_driver,
            passengers, suitcases, hand_luggage, extras, distance, duration,
            status, payment_status, total_price, created_at, updated_at
         ) VALUES (
            @reference, @fromLocation, @toLocation, @departDate, @departTime, @vehicleId,
            @passengerName, @email, @phone, @countryCode, @flightNumber, @noteToDriver,
            @passengers, @suitcases, @handLuggage, @extras, @distance, @duration,
            'pending', 'unpaid', @totalPrice, @timestamp, @timestamp
         )`,
      )
      .run({
        reference,
        fromLocation: input.fromLocation,
        toLocation: input.toLocation,
        departDate: input.departDate,
        departTime: input.departTime,
        vehicleId: input.vehicleId,
        passengerName: input.passengerName,
        email: input.email,
        phone: input.phone,
        countryCode: input.countryCode,
        flightNumber: input.flightNumber,
        noteToDriver: input.noteToDriver,
        passengers: input.passengers,
        suitcases: input.suitcases,
        handLuggage: input.handLuggage,
        extras: JSON.stringify(input.extras),
        distance: input.distance,
        duration: input.duration,
        totalPrice: input.totalPrice,
        timestamp,
      });

    const created = bookings.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error('Booking could not be created');
    return created;
  },

  findById(id: number): BookingDto | undefined {
    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as
      | BookingRow
      | undefined;
    return row ? bookingWithVehicle(row) : undefined;
  },

  findByReference(reference: string): BookingDto | undefined {
    const row = db
      .prepare('SELECT * FROM bookings WHERE reference = ? COLLATE NOCASE')
      .get(reference) as BookingRow | undefined;
    return row ? bookingWithVehicle(row) : undefined;
  },

  all(): BookingDto[] {
    const rows = db
      .prepare('SELECT * FROM bookings ORDER BY datetime(created_at) DESC')
      .all() as BookingRow[];
    return rows.map(bookingWithVehicle);
  },

  unpaid(): BookingDto[] {
    const rows = db
      .prepare(
        `SELECT * FROM bookings
         WHERE payment_status IS NULL OR payment_status != 'paid'
         ORDER BY datetime(created_at) DESC`,
      )
      .all() as BookingRow[];
    return rows.map(bookingWithVehicle);
  },

  recent(limit = 10): BookingDto[] {
    const rows = db
      .prepare('SELECT * FROM bookings ORDER BY datetime(created_at) DESC LIMIT ?')
      .all(limit) as BookingRow[];
    return rows.map(bookingWithVehicle);
  },

  update(id: number, input: UpdateBookingInput): BookingDto | undefined {
    db.prepare(
      `UPDATE bookings SET
          from_location = @fromLocation,
          to_location = @toLocation,
          depart_date = @departDate,
          depart_time = @departTime,
          vehicle_id = @vehicleId,
          passenger_name = @passengerName,
          email = @email,
          phone = @phone,
          country_code = @countryCode,
          flight_number = @flightNumber,
          note_to_driver = @noteToDriver,
          status = @status,
          payment_status = @paymentStatus,
          payment_id = @paymentId,
          total_price = @totalPrice,
          updated_at = @timestamp
       WHERE id = @id`,
    ).run({ ...input, id, timestamp: nowIso() });

    return bookings.findById(id);
  },

  markPaid(id: number, paymentId: string | null): BookingDto | undefined {
    db.prepare(
      `UPDATE bookings
         SET status = 'confirmed', payment_status = 'paid',
             payment_id = COALESCE(@paymentId, payment_id), updated_at = @timestamp
       WHERE id = @id`,
    ).run({ id, paymentId, timestamp: nowIso() });

    return bookings.findById(id);
  },

  stats() {
    const total = (db.prepare('SELECT COUNT(*) AS c FROM bookings').get() as { c: number }).c;
    const revenue = (
      db
        .prepare(`SELECT COALESCE(SUM(total_price), 0) AS s FROM bookings WHERE payment_status = 'paid'`)
        .get() as { s: number }
    ).s;
    const today = (
      db
        .prepare(`SELECT COUNT(*) AS c FROM bookings WHERE date(created_at) = date('now')`)
        .get() as { c: number }
    ).c;
    const pending = (
      db.prepare(`SELECT COUNT(*) AS c FROM bookings WHERE status = 'pending'`).get() as {
        c: number;
      }
    ).c;

    const byStatus = db
      .prepare('SELECT status, COUNT(*) AS count FROM bookings GROUP BY status ORDER BY count DESC')
      .all() as { status: string; count: number }[];

    const byVehicle = db
      .prepare(
        `SELECT COALESCE(v.name, 'N/A') AS name, COUNT(*) AS count
           FROM bookings b
           LEFT JOIN vehicles v ON v.id = b.vehicle_id
          GROUP BY name
          ORDER BY count DESC`,
      )
      .all() as { name: string; count: number }[];

    const revenueByDay = db
      .prepare(
        `SELECT date(created_at) AS day,
                COUNT(*) AS bookings,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END), 0) AS revenue
           FROM bookings
          WHERE date(created_at) >= date('now', '-29 days')
          GROUP BY day
          ORDER BY day ASC`,
      )
      .all() as { day: string; bookings: number; revenue: number }[];

    return {
      totalBookings: total,
      totalRevenue: Math.round(revenue * 100) / 100,
      todayBookings: today,
      pendingBookings: pending,
      byStatus,
      byVehicle,
      revenueByDay,
    };
  },
};

/* ------------------------------------------------------- contact messages */

export const contactMessages = {
  create(input: {
    name: string;
    email: string;
    subject: string | null;
    message: string;
  }): ContactMessageDto {
    const timestamp = nowIso();
    const result = db
      .prepare(
        `INSERT INTO contact_messages (name, email, subject, message, read, created_at, updated_at)
         VALUES (@name, @email, @subject, @message, 0, @timestamp, @timestamp)`,
      )
      .run({ ...input, timestamp });

    const row = db
      .prepare('SELECT * FROM contact_messages WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as ContactMessageRow;
    return toContactMessage(row);
  },

  all(): ContactMessageDto[] {
    const rows = db
      .prepare('SELECT * FROM contact_messages ORDER BY datetime(created_at) DESC')
      .all() as ContactMessageRow[];
    return rows.map(toContactMessage);
  },

  markRead(id: number, read = true): ContactMessageDto | undefined {
    db.prepare('UPDATE contact_messages SET read = ?, updated_at = ? WHERE id = ?').run(
      read ? 1 : 0,
      nowIso(),
      id,
    );
    const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as
      | ContactMessageRow
      | undefined;
    return row ? toContactMessage(row) : undefined;
  },

  unreadCount(): number {
    return (
      db.prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE read = 0').get() as {
        c: number;
      }
    ).c;
  },
};

/* ----------------------------------------------------------- subscribers */

export const subscribers = {
  all(): SubscriberDto[] {
    const rows = db
      .prepare('SELECT * FROM subscribers ORDER BY datetime(created_at) DESC')
      .all() as SubscriberRow[];
    return rows.map(toSubscriber);
  },

  activeCount(): number {
    return (
      db.prepare('SELECT COUNT(*) AS c FROM subscribers WHERE active = 1').get() as { c: number }
    ).c;
  },

  /** Returns `{ subscriber, created }` so callers can log a notification once. */
  firstOrCreate(email: string, name: string | null): { subscriber: SubscriberDto; created: boolean } {
    const existing = db
      .prepare('SELECT * FROM subscribers WHERE email = ? COLLATE NOCASE')
      .get(email) as SubscriberRow | undefined;

    if (existing) {
      return { subscriber: toSubscriber(existing), created: false };
    }

    const timestamp = nowIso();
    const result = db
      .prepare(
        `INSERT INTO subscribers (email, name, active, created_at, updated_at)
         VALUES (?, ?, 1, ?, ?)`,
      )
      .run(email, name, timestamp, timestamp);

    const row = db
      .prepare('SELECT * FROM subscribers WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as SubscriberRow;
    return { subscriber: toSubscriber(row), created: true };
  },

  setActive(id: number, active: boolean): SubscriberDto | undefined {
    db.prepare('UPDATE subscribers SET active = ?, updated_at = ? WHERE id = ?').run(
      active ? 1 : 0,
      nowIso(),
      id,
    );
    const row = db.prepare('SELECT * FROM subscribers WHERE id = ?').get(id) as
      | SubscriberRow
      | undefined;
    return row ? toSubscriber(row) : undefined;
  },

  activeEmails(): { email: string; name: string | null }[] {
    return db
      .prepare('SELECT email, name FROM subscribers WHERE active = 1')
      .all() as { email: string; name: string | null }[];
  },
};

/* ---------------------------------------------------------------- admins */

export const admins = {
  findByEmail(email: string): AdminRow | undefined {
    return db.prepare('SELECT * FROM admins WHERE email = ? COLLATE NOCASE').get(email) as
      | AdminRow
      | undefined;
  },

  findById(id: number): AdminRow | undefined {
    return db.prepare('SELECT * FROM admins WHERE id = ?').get(id) as AdminRow | undefined;
  },

  create(input: { name: string; email: string; passwordHash: string }): AdminRow {
    const timestamp = nowIso();
    const result = db
      .prepare(
        `INSERT INTO admins (name, email, password, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(input.name, input.email, input.passwordHash, timestamp, timestamp);
    return admins.findById(Number(result.lastInsertRowid))!;
  },

  count(): number {
    return (db.prepare('SELECT COUNT(*) AS c FROM admins').get() as { c: number }).c;
  },
};

/* --------------------------------------------------------- notifications */

export type NotificationType = 'booking' | 'contact' | 'subscriber' | 'system';

export const notifications = {
  create(type: NotificationType, message: string, data?: unknown): NotificationDto {
    const timestamp = nowIso();
    const result = db
      .prepare(
        `INSERT INTO admin_notifications (type, message, data, read, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?)`,
      )
      .run(type, message, data === undefined ? null : JSON.stringify(data), timestamp, timestamp);

    const row = db
      .prepare('SELECT * FROM admin_notifications WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as NotificationRow;
    return toNotification(row);
  },

  recent(limit = 25): NotificationDto[] {
    const rows = db
      .prepare('SELECT * FROM admin_notifications ORDER BY datetime(created_at) DESC LIMIT ?')
      .all(limit) as NotificationRow[];
    return rows.map(toNotification);
  },

  unreadCount(): number {
    return (
      db.prepare('SELECT COUNT(*) AS c FROM admin_notifications WHERE read = 0').get() as {
        c: number;
      }
    ).c;
  },

  markAllRead(): void {
    db.prepare('UPDATE admin_notifications SET read = 1, updated_at = ? WHERE read = 0').run(
      nowIso(),
    );
  },
};

/* ------------------------------------------------------------ promotions */

export const promotions = {
  create(input: {
    subject: string;
    message: string;
    recipientCount: number;
    sentCount: number;
    status: string;
  }): PromotionDto {
    const timestamp = nowIso();
    const result = db
      .prepare(
        `INSERT INTO promotions (subject, message, recipient_count, sent_count, status, created_at, updated_at)
         VALUES (@subject, @message, @recipientCount, @sentCount, @status, @timestamp, @timestamp)`,
      )
      .run({ ...input, timestamp });

    const row = db
      .prepare('SELECT * FROM promotions WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as PromotionRow;
    return toPromotion(row);
  },

  recent(limit = 20): PromotionDto[] {
    const rows = db
      .prepare('SELECT * FROM promotions ORDER BY datetime(created_at) DESC LIMIT ?')
      .all(limit) as PromotionRow[];
    return rows.map(toPromotion);
  },
};

/* ----------------------------------------------------------------- zones */

export const zones = {
  all(): ZoneDto[] {
    const rows = db.prepare('SELECT * FROM zones ORDER BY id ASC').all() as ZoneRow[];
    return rows.map(toZone);
  },

  create(input: { name: string; colour: string; geometry: [number, number][] }): ZoneDto {
    const timestamp = nowIso();
    const result = db
      .prepare(
        `INSERT INTO zones (name, colour, geometry, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(input.name, input.colour, JSON.stringify(input.geometry), timestamp, timestamp);

    const row = db
      .prepare('SELECT * FROM zones WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as ZoneRow;
    return toZone(row);
  },

  remove(id: number): boolean {
    const result = db.prepare('DELETE FROM zones WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
