import { nowIso, one, query, run } from './db.js';
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
export async function generateReference(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let suffix = '';
    for (let i = 0; i < 8; i += 1) {
      suffix += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
    }
    const reference = `ATH-${suffix}`;
    const existing = await one<{ hit: number }>(
      'SELECT 1 AS hit FROM bookings WHERE reference = ?',
      [reference],
    );
    if (!existing) return reference;
  }
  return `ATH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

/* -------------------------------------------------------------- airports */

export const airports = {
  async all(): Promise<AirportDto[]> {
    const rows = await query<AirportRow>('SELECT * FROM airports ORDER BY sort_order ASC');
    return rows.map(toAirport);
  },

  async search(search: string, limit = 10): Promise<AirportDto[]> {
    const trimmed = search.trim();
    if (!trimmed) {
      const rows = await query<AirportRow>(
        'SELECT * FROM airports ORDER BY sort_order ASC LIMIT ?',
        [limit],
      );
      return rows.map(toAirport);
    }

    const like = `%${trimmed}%`;
    const rows = await query<AirportRow>(
      `SELECT * FROM airports
        WHERE name LIKE ?
           OR code LIKE ?
           OR city LIKE ?
        ORDER BY sort_order ASC
        LIMIT ?`,
      [like, like, like, limit],
    );
    return rows.map(toAirport);
  },
};

/* -------------------------------------------------------------- vehicles */

export const vehicles = {
  async all(): Promise<VehicleDto[]> {
    const rows = await query<VehicleRow>('SELECT * FROM vehicles ORDER BY sort_order ASC');
    return rows.map(toVehicle);
  },

  findRow(id: number): Promise<VehicleRow | undefined> {
    return one<VehicleRow>('SELECT * FROM vehicles WHERE id = ?', [id]);
  },

  async find(id: number): Promise<VehicleDto | undefined> {
    const row = await vehicles.findRow(id);
    return row ? toVehicle(row) : undefined;
  },

  /** Vehicles with the number of bookings attached, for the admin fleet page. */
  async withBookingCounts(): Promise<(VehicleDto & { bookingCount: number })[]> {
    const rows = await query<VehicleRow & { booking_count: number }>(
      `SELECT v.*, COUNT(b.id) AS booking_count
         FROM vehicles v
         LEFT JOIN bookings b ON b.vehicle_id = v.id
        GROUP BY v.id
        ORDER BY v.sort_order ASC`,
    );
    return rows.map((row) => ({ ...toVehicle(row), bookingCount: Number(row.booking_count) }));
  },
};

/* ------------------------------------------------------------------ faqs */

export const faqs = {
  async all(): Promise<FaqDto[]> {
    const rows = await query<FaqRow>('SELECT * FROM faqs ORDER BY sort_order ASC');
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

/** A booking row with its vehicle joined in as JSON, avoiding an N+1 query. */
type JoinedBookingRow = BookingRow & { vehicle: VehicleRow | string | null };

/*
 * The vehicle is folded into each booking row as a JSON string, so a list of
 * bookings costs one query rather than one per row. SQLite's json_object()
 * needs the columns spelled out, unlike Postgres' to_jsonb(v).
 */
const VEHICLE_JSON = `json_object(
  'id', v.id, 'name', v.name, 'slug', v.slug, 'price', v.price,
  'short_base', v.short_base, 'short_per_mile', v.short_per_mile,
  'long_base', v.long_base, 'long_per_mile', v.long_per_mile,
  'passengers', v.passengers, 'suitcases', v.suitcases,
  'hand_luggage_note', v.hand_luggage_note, 'image', v.image,
  'description', v.description, 'car_model', v.car_model,
  'sort_order', v.sort_order, 'created_at', v.created_at, 'updated_at', v.updated_at
)`;

const SELECT_BOOKING = `
  SELECT b.*, CASE WHEN v.id IS NULL THEN NULL ELSE ${VEHICLE_JSON} END AS vehicle
    FROM bookings b
    LEFT JOIN vehicles v ON v.id = b.vehicle_id
`;

const mapJoined = (row: JoinedBookingRow): BookingDto => {
  /* json_object() hands back a string; Postgres' to_jsonb() handed back an object. */
  const vehicle = typeof row.vehicle === 'string' ? (JSON.parse(row.vehicle) as VehicleRow) : row.vehicle;
  return toBooking(row, vehicle);
};

export const bookings = {
  async create(input: CreateBookingInput): Promise<BookingDto> {
    const reference = await generateReference();
    const timestamp = nowIso();

    const created = await one<{ id: number }>(
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
       )
       RETURNING id`,
      {
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
      },
    );

    if (!created) throw new Error('Booking could not be created');

    const booking = await bookings.findById(created.id);
    if (!booking) throw new Error('Booking could not be created');
    return booking;
  },

  async findById(id: number): Promise<BookingDto | undefined> {
    const row = await one<JoinedBookingRow>(`${SELECT_BOOKING} WHERE b.id = ?`, [id]);
    return row ? mapJoined(row) : undefined;
  },

  async findByReference(reference: string): Promise<BookingDto | undefined> {
    const row = await one<JoinedBookingRow>(
      `${SELECT_BOOKING} WHERE upper(b.reference) = upper(?)`,
      [reference],
    );
    return row ? mapJoined(row) : undefined;
  },

  async all(): Promise<BookingDto[]> {
    const rows = await query<JoinedBookingRow>(`${SELECT_BOOKING} ORDER BY b.created_at DESC`);
    return rows.map(mapJoined);
  },

  async unpaid(): Promise<BookingDto[]> {
    const rows = await query<JoinedBookingRow>(
      `${SELECT_BOOKING}
        WHERE b.payment_status IS NULL OR b.payment_status <> 'paid'
        ORDER BY b.created_at DESC`,
    );
    return rows.map(mapJoined);
  },

  async recent(limit = 10): Promise<BookingDto[]> {
    const rows = await query<JoinedBookingRow>(
      `${SELECT_BOOKING} ORDER BY b.created_at DESC LIMIT ?`,
      [limit],
    );
    return rows.map(mapJoined);
  },

  async update(id: number, input: UpdateBookingInput): Promise<BookingDto | undefined> {
    await run(
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
      { ...input, id, timestamp: nowIso() },
    );

    return bookings.findById(id);
  },

  async markPaid(id: number, paymentId: string | null): Promise<BookingDto | undefined> {
    await run(
      `UPDATE bookings
          SET status = 'confirmed',
              payment_status = 'paid',
              payment_id = COALESCE(@paymentId, payment_id),
              updated_at = @timestamp
        WHERE id = @id`,
      { id, paymentId, timestamp: nowIso() },
    );

    return bookings.findById(id);
  },

  async stats() {
    const [totals, byStatus, byVehicle, revenueByDay] = await Promise.all([
      one<{
        total: number;
        revenue: number;
        today: number;
        pending: number;
      }>(
        `SELECT COUNT(*)                                                               AS total,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_price END), 0) AS revenue,
                SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END)        AS today,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)                    AS pending
           FROM bookings`,
      ),

      query<{ status: string; count: number }>(
        `SELECT status, COUNT(*) AS count
           FROM bookings
          GROUP BY status
          ORDER BY count DESC`,
      ),

      query<{ name: string; count: number }>(
        `SELECT COALESCE(v.name, 'N/A') AS name, COUNT(*) AS count
           FROM bookings b
           LEFT JOIN vehicles v ON v.id = b.vehicle_id
          GROUP BY 1
          ORDER BY count DESC`,
      ),

      query<{ day: string; bookings: number; revenue: number }>(
        `SELECT strftime('%Y-%m-%d', created_at) AS day,
                COUNT(*) AS bookings,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END), 0) AS revenue
           FROM bookings
          WHERE date(created_at) >= date('now', '-29 days')
          GROUP BY 1
          ORDER BY 1 ASC`,
      ),
    ]);

    return {
      totalBookings: Number(totals?.total ?? 0),
      totalRevenue: Math.round(Number(totals?.revenue ?? 0) * 100) / 100,
      todayBookings: Number(totals?.today ?? 0),
      pendingBookings: Number(totals?.pending ?? 0),
      byStatus,
      byVehicle,
      revenueByDay,
    };
  },
};

/* ------------------------------------------------------- contact messages */

export const contactMessages = {
  async create(input: {
    name: string;
    email: string;
    subject: string | null;
    message: string;
  }): Promise<ContactMessageDto> {
    const timestamp = nowIso();
    const row = await one<ContactMessageRow>(
      `INSERT INTO contact_messages (name, email, subject, message, read, created_at, updated_at)
       VALUES (@name, @email, @subject, @message, 0, @timestamp, @timestamp)
       RETURNING *`,
      { ...input, timestamp },
    );
    if (!row) throw new Error('Message could not be saved');
    return toContactMessage(row);
  },

  async all(): Promise<ContactMessageDto[]> {
    const rows = await query<ContactMessageRow>(
      'SELECT * FROM contact_messages ORDER BY created_at DESC',
    );
    return rows.map(toContactMessage);
  },

  async markRead(id: number, read = true): Promise<ContactMessageDto | undefined> {
    const row = await one<ContactMessageRow>(
      'UPDATE contact_messages SET read = ?, updated_at = ? WHERE id = ? RETURNING *',
      [read, nowIso(), id],
    );
    return row ? toContactMessage(row) : undefined;
  },

  async unreadCount(): Promise<number> {
    const row = await one<{ c: number }>(
      'SELECT COUNT(*) AS c FROM contact_messages WHERE read = 0',
    );
    return Number(row?.c ?? 0);
  },
};

/* ----------------------------------------------------------- subscribers */

export const subscribers = {
  async all(): Promise<SubscriberDto[]> {
    const rows = await query<SubscriberRow>('SELECT * FROM subscribers ORDER BY created_at DESC');
    return rows.map(toSubscriber);
  },

  async activeCount(): Promise<number> {
    const row = await one<{ c: number }>(
      'SELECT COUNT(*) AS c FROM subscribers WHERE active = 1',
    );
    return Number(row?.c ?? 0);
  },

  /** Returns `{ subscriber, created }` so callers can log a notification once. */
  async firstOrCreate(
    email: string,
    name: string | null,
  ): Promise<{ subscriber: SubscriberDto; created: boolean }> {
    const existing = await one<SubscriberRow>(
      'SELECT * FROM subscribers WHERE lower(email) = lower(?)',
      [email],
    );

    if (existing) {
      return { subscriber: toSubscriber(existing), created: false };
    }

    /*
     * The SELECT above already settled whether this address is new, so the
     * insert only has to survive a race with a concurrent sign-up. SQLite has
     * no xmax to report which branch ON CONFLICT took, so the conflict path
     * re-reads the row instead.
     */
    const timestamp = nowIso();
    const row = await one<SubscriberRow>(
      `INSERT INTO subscribers (email, name, active, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT (email) DO UPDATE SET updated_at = excluded.updated_at
       RETURNING *`,
      [email, name, timestamp, timestamp],
    );

    if (!row) throw new Error('Subscriber could not be saved');

    /* Created only if the stored created_at is the one this call just wrote. */
    return { subscriber: toSubscriber(row), created: row.created_at === timestamp };
  },

  async setActive(id: number, active: boolean): Promise<SubscriberDto | undefined> {
    const row = await one<SubscriberRow>(
      'UPDATE subscribers SET active = ?, updated_at = ? WHERE id = ? RETURNING *',
      [active, nowIso(), id],
    );
    return row ? toSubscriber(row) : undefined;
  },

  activeEmails(): Promise<{ email: string; name: string | null }[]> {
    return query<{ email: string; name: string | null }>(
      'SELECT email, name FROM subscribers WHERE active = 1',
    );
  },
};

/* ---------------------------------------------------------------- admins */

export const admins = {
  findByEmail(email: string): Promise<AdminRow | undefined> {
    return one<AdminRow>('SELECT * FROM admins WHERE lower(email) = lower(?)', [email]);
  },

  findById(id: number): Promise<AdminRow | undefined> {
    return one<AdminRow>('SELECT * FROM admins WHERE id = ?', [id]);
  },

  async create(input: { name: string; email: string; passwordHash: string }): Promise<AdminRow> {
    const timestamp = nowIso();
    const row = await one<AdminRow>(
      `INSERT INTO admins (name, email, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [input.name, input.email, input.passwordHash, timestamp, timestamp],
    );
    if (!row) throw new Error('Admin could not be created');
    return row;
  },

  async count(): Promise<number> {
    const row = await one<{ c: number }>('SELECT COUNT(*) AS c FROM admins');
    return Number(row?.c ?? 0);
  },
};

/* --------------------------------------------------------- notifications */

export type NotificationType = 'booking' | 'contact' | 'subscriber' | 'system';

export const notifications = {
  async create(type: NotificationType, message: string, data?: unknown): Promise<NotificationDto> {
    const timestamp = nowIso();
    const row = await one<NotificationRow>(
      `INSERT INTO admin_notifications (type, message, data, read, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?)
       RETURNING *`,
      [type, message, data === undefined ? null : JSON.stringify(data), timestamp, timestamp],
    );
    if (!row) throw new Error('Notification could not be saved');
    return toNotification(row);
  },

  async recent(limit = 25): Promise<NotificationDto[]> {
    const rows = await query<NotificationRow>(
      'SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(toNotification);
  },

  async unreadCount(): Promise<number> {
    const row = await one<{ c: number }>(
      'SELECT COUNT(*) AS c FROM admin_notifications WHERE read = 0',
    );
    return Number(row?.c ?? 0);
  },

  async markAllRead(): Promise<void> {
    await run('UPDATE admin_notifications SET read = 1, updated_at = ? WHERE read = 0', [
      nowIso(),
    ]);
  },
};

/* ------------------------------------------------------------ promotions */

export const promotions = {
  async create(input: {
    subject: string;
    message: string;
    recipientCount: number;
    sentCount: number;
    status: string;
  }): Promise<PromotionDto> {
    const timestamp = nowIso();
    const row = await one<PromotionRow>(
      `INSERT INTO promotions (subject, message, recipient_count, sent_count, status, created_at, updated_at)
       VALUES (@subject, @message, @recipientCount, @sentCount, @status, @timestamp, @timestamp)
       RETURNING *`,
      { ...input, timestamp },
    );
    if (!row) throw new Error('Promotion could not be saved');
    return toPromotion(row);
  },

  async recent(limit = 20): Promise<PromotionDto[]> {
    const rows = await query<PromotionRow>(
      'SELECT * FROM promotions ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(toPromotion);
  },
};

/* ----------------------------------------------------------------- zones */

export const zones = {
  async all(): Promise<ZoneDto[]> {
    const rows = await query<ZoneRow>('SELECT * FROM zones ORDER BY id ASC');
    return rows.map(toZone);
  },

  async create(input: {
    name: string;
    colour: string;
    geometry: [number, number][];
  }): Promise<ZoneDto> {
    const timestamp = nowIso();
    const row = await one<ZoneRow>(
      `INSERT INTO zones (name, colour, geometry, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [input.name, input.colour, JSON.stringify(input.geometry), timestamp, timestamp],
    );
    if (!row) throw new Error('Zone could not be saved');
    return toZone(row);
  },

  async remove(id: number): Promise<boolean> {
    const changes = await run('DELETE FROM zones WHERE id = ?', [id]);
    return changes > 0;
  },
};
