import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MONTHS_LONG, WEEKDAYS_SHORT, parseDateOnly, toDateOnly } from '@/lib/format';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Button } from '@/components/ui/Button';

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

const ITEM_HEIGHT = 42;

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

/** Current time rounded up to the next five-minute mark. */
function defaultTimeParts(): { hour: string; minute: string } {
  const now = new Date();
  const rounded = new Date(now.getTime() + (5 - (now.getMinutes() % 5)) * 60_000);
  return {
    hour: String(rounded.getHours()).padStart(2, '0'),
    minute: String(Math.floor(rounded.getMinutes() / 5) * 5).padStart(2, '0'),
  };
}

interface CalendarCell {
  day: number | null;
  disabled: boolean;
  isToday: boolean;
  iso: string | null;
}

function buildCalendar(year: number, month: number, selectedIso: string | null): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfToday();

  const cells: CalendarCell[] = Array.from({ length: firstWeekday }, () => ({
    day: null,
    disabled: true,
    isToday: false,
    iso: null,
  }));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({
      day,
      disabled: date < today,
      isToday: date.getTime() === today.getTime(),
      iso: toDateOnly(date),
    });
  }

  /** `selectedIso` is compared by the caller; kept here for symmetry. */
  void selectedIso;
  return cells;
}

interface TimeWheelProps {
  label: string;
  values: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

/** Scroll-snapping column of values, mirroring the original time picker. */
function TimeWheel({ label, values, value, onChange }: TimeWheelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const programmatic = useRef(false);

  const scrollTo = useCallback(
    (next: string, behavior: ScrollBehavior = 'smooth') => {
      const element = scrollRef.current;
      if (!element) return;
      const index = values.indexOf(next);
      if (index < 0) return;
      programmatic.current = true;
      element.scrollTo({ top: index * ITEM_HEIGHT, behavior });
      window.setTimeout(() => {
        programmatic.current = false;
      }, 400);
    },
    [values],
  );

  useEffect(() => {
    scrollTo(value, 'auto');
  }, [scrollTo, value]);

  const handleScroll = () => {
    if (programmatic.current) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const element = scrollRef.current;
      if (!element) return;
      const index = Math.round(element.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, values.length - 1));
      if (values[clamped] !== value) onChange(values[clamped]);
    }, 120);
  };

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  return (
    <div>
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <div className="relative h-[210px] w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[84px] z-10 h-[42px] rounded-md border-y border-accent/30 bg-accent/15"
        />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          className="hide-scrollbar h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
        >
          <div className="h-[84px]" aria-hidden />
          {values.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === value}
              onClick={() => {
                onChange(item);
                scrollTo(item);
              }}
              className={cn(
                'flex h-[42px] w-full snap-center items-center justify-center transition-all duration-150',
                item === value
                  ? 'text-base font-bold text-gray-900'
                  : 'text-sm text-gray-400 hover:text-gray-600',
              )}
            >
              {item}
            </button>
          ))}
          <div className="h-[84px]" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export interface DateTimePickerProps {
  date: string;
  time: string;
  onChange: (next: { date: string; time: string }) => void;
  size?: 'md' | 'sm';
  placeholder?: string;
  invalid?: boolean;
  /** Opens the panel as soon as it mounts — used after both locations are set. */
  autoOpen?: boolean;
  className?: string;
  id?: string;
}

export function DateTimePicker({
  date,
  time,
  onChange,
  size = 'md',
  placeholder = 'Depart',
  invalid = false,
  autoOpen = false,
  className,
  id,
}: DateTimePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'date' | 'time'>('date');

  const initialDate = parseDateOnly(date) ?? startOfToday();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [draftDate, setDraftDate] = useState(date);

  const fallbackTime = defaultTimeParts();
  const [hour, setHour] = useState(time ? time.slice(0, 2) : fallbackTime.hour);
  const [minute, setMinute] = useState(time ? time.slice(3, 5) : fallbackTime.minute);

  useClickOutside(containerRef, () => setOpen(false), open);

  const openPanel = useCallback(() => {
    const anchor = parseDateOnly(date) ?? startOfToday();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    setDraftDate(date);
    setTab('date');
    setOpen(true);
  }, [date]);

  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpen && !autoOpened.current && !date) {
      autoOpened.current = true;
      const timer = window.setTimeout(openPanel, 350);
      return () => window.clearTimeout(timer);
    }
  }, [autoOpen, date, openPanel]);

  const cells = useMemo(
    () => buildCalendar(viewYear, viewMonth, draftDate),
    [viewYear, viewMonth, draftDate],
  );

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current + 1, current + 2];
  }, []);

  const displayValue = useMemo(() => {
    const parsed = parseDateOnly(date);
    if (!parsed) return '';
    const label = `${WEEKDAYS_SHORT[parsed.getDay()]}, ${parsed.getDate()} ${
      MONTHS_LONG[parsed.getMonth()]
    } ${parsed.getFullYear()}`;
    return time ? `${label} at ${time}` : label;
  }, [date, time]);

  const draftLabel = useMemo(() => {
    const parsed = parseDateOnly(draftDate);
    if (!parsed) return '';
    return `${WEEKDAYS_SHORT[parsed.getDay()]}, ${parsed.getDate()} ${
      MONTHS_LONG[parsed.getMonth()]
    } ${parsed.getFullYear()}`;
  }, [draftDate]);

  const shiftMonth = (delta: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectDay = (cell: CalendarCell) => {
    if (!cell.iso || cell.disabled) return;
    setDraftDate(cell.iso);
    window.setTimeout(() => setTab('time'), 220);
  };

  const confirm = () => {
    if (!draftDate) return;
    onChange({ date: draftDate, time: `${hour}:${minute}` });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        className={cn(
          'field flex items-center gap-2.5 text-left',
          size === 'sm' ? 'py-2.5 pl-3 text-sm' : 'py-3.5 pl-3.5',
          invalid && 'field-error',
          !displayValue && 'text-gray-400',
        )}
      >
        <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
        <span className="truncate">{displayValue || placeholder}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose departure date and time"
          className={cn(
            'absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card-hover animate-slide-down',
            'sm:left-auto sm:right-0 sm:w-80',
          )}
        >
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => setTab('date')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors',
                tab === 'date'
                  ? 'border-accent text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600',
              )}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden /> Date
              {draftLabel && (
                <span className="text-xs font-normal text-gray-400">
                  {draftLabel.split(', ')[1]?.split(' ').slice(0, 2).join(' ')}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => draftDate && setTab('time')}
              disabled={!draftDate}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors',
                tab === 'time'
                  ? 'border-accent text-gray-900'
                  : draftDate
                    ? 'border-transparent text-gray-400 hover:text-gray-600'
                    : 'cursor-not-allowed border-transparent text-gray-300',
              )}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden /> Time
              <span className="text-xs font-normal text-gray-400">{`${hour}:${minute}`}</span>
            </button>
          </div>

          {tab === 'date' ? (
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>

                <div className="flex items-center gap-2">
                  <select
                    aria-label="Month"
                    value={viewMonth}
                    onChange={(event) => setViewMonth(Number(event.target.value))}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {MONTHS_LONG.map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Year"
                    value={viewYear}
                    onChange={(event) => setViewYear(Number(event.target.value))}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7">
                {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day) => (
                  <div
                    key={day}
                    className="py-1 text-center text-xs font-semibold text-gray-400"
                    aria-hidden
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {cells.map((cell, index) => {
                  const selected = Boolean(cell.iso && cell.iso === draftDate);
                  return (
                    <button
                      key={cell.iso ?? `pad-${index}`}
                      type="button"
                      disabled={cell.disabled || !cell.day}
                      aria-label={cell.iso ?? undefined}
                      aria-pressed={selected}
                      onClick={() => selectDay(cell)}
                      className={cn(
                        'flex aspect-square w-full items-center justify-center rounded-lg text-sm transition-colors',
                        !cell.day && 'cursor-default',
                        cell.day && cell.disabled && 'cursor-not-allowed text-gray-300',
                        cell.day &&
                          !cell.disabled &&
                          !selected &&
                          'cursor-pointer text-gray-700 hover:bg-accent-50',
                        cell.isToday && !selected && 'font-semibold text-primary-700',
                        selected && 'bg-accent font-bold text-ink shadow-sm hover:bg-accent-500',
                      )}
                    >
                      {cell.day ?? ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="mb-5 text-center">
                <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">Selected date</p>
                <p className="text-sm font-semibold text-gray-700">{draftLabel}</p>
              </div>

              <div className="flex items-start justify-center gap-1">
                <TimeWheel label="Hour" values={HOURS} value={hour} onChange={setHour} />
                <div className="flex flex-col items-center justify-center pt-12">
                  <span className="text-2xl font-bold text-gray-300" aria-hidden>
                    :
                  </span>
                </div>
                <TimeWheel label="Min" values={MINUTES} value={minute} onChange={setMinute} />
              </div>

              <div className="mt-5 text-center">
                <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-2.5">
                  <Clock className="h-4 w-4 text-gray-400" aria-hidden />
                  <span className="text-lg font-bold tracking-wide text-gray-800">
                    {hour}:{minute}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            <Button
              variant={draftDate ? 'secondary' : 'outline'}
              fullWidth
              disabled={!draftDate}
              onClick={() => (tab === 'date' ? setTab('time') : confirm())}
            >
              {tab === 'date' ? 'Next: pick time' : 'Select'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
