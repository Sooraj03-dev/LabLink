import { z } from "zod";

export const slotMs = 30 * 60_000;
const dayMs = 24 * 60 * 60_000;
const indiaOffset = 330 * 60_000;
export const unitId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundary = z.number().int().min(0).max(1440).multipleOf(30);
export const scheduleSchema = z
  .object({
    resourceId: unitId,
    model: z.string().min(1),
    lab: z.string().min(1),
    units: z.array(unitId).min(1).max(12),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1),
    openMinute: boundary,
    closeMinute: boundary,
    timeZone: z.literal("Asia/Kolkata"),
  })
  .refine(
    (s) =>
      s.openMinute < s.closeMinute && new Set(s.units).size === s.units.length,
  );
export type Schedule = z.infer<typeof scheduleSchema>;
export const reservation = z.object({
  unit: unitId,
  start: z.number().int().positive().max(8.64e15),
  blocks: z.number().int().min(1).max(4),
});
export type Reservation = z.infer<typeof reservation>;
export const bookingInput = reservation.extend({
  requestId: z
    .string()
    .min(1)
    .max(300)
    .regex(/^(?!\.{1,2}$)[^/]+$/),
});
export type Occupied = Pick<Reservation, "start" | "unit">;
export interface Board {
  schedule: Schedule | null;
  occupied: Occupied[];
  now: number;
  source: "campus" | "emulator" | "browser";
}
export function horizon(now: number) {
  const start = Math.floor((now + indiaOffset) / dayMs) * dayMs - indiaOffset;
  return { start, end: start + 14 * dayMs };
}
export function coveredSlots(booking: Reservation): Occupied[] {
  return Array.from({ length: booking.blocks }, (_, i) => ({
    unit: booking.unit,
    start: booking.start + i * slotMs,
  }));
}
export function fitsSchedule(s: Schedule, r: Reservation, now: number) {
  if (
    !s.units.includes(r.unit) ||
    r.start <= now ||
    r.start >= horizon(now).end ||
    r.start % slotMs !== 0
  )
    return false;
  const local = new Date(r.start + indiaOffset);
  const minute = local.getUTCHours() * 60 + local.getUTCMinutes();
  return (
    s.weekdays.includes(local.getUTCDay()) &&
    minute >= s.openMinute &&
    minute + r.blocks * 30 <= s.closeMinute
  );
}
export function availableStarts(
  s: Schedule,
  unit: string,
  blocks: number,
  occupied: Occupied[],
  now: number,
) {
  const taken = new Set(
    occupied.filter((slot) => slot.unit === unit).map((slot) => slot.start),
  );
  const options: number[] = [];
  const end = horizon(now).end;
  for (
    let start = (Math.floor(now / slotMs) + 1) * slotMs;
    start < end;
    start += slotMs
  ) {
    const choice = { start, unit, blocks };
    if (
      fitsSchedule(s, choice, now) &&
      coveredSlots(choice).every((slot) => !taken.has(slot.start))
    )
      options.push(start);
  }
  return options;
}
export function nextSession({ schedule, occupied, now }: Board) {
  if (!schedule) return;
  let first: Reservation | undefined;
  for (const unit of schedule.units) {
    const start = availableStarts(schedule, unit, 1, occupied, now)[0];
    if (start !== undefined && (!first || start < first.start))
      first = { start, unit, blocks: 1 };
  }
  return first;
}
export function reservationIssue(
  s: Schedule,
  choice: Reservation,
  existing: Reservation[],
  hours: number,
  now: number,
) {
  if (!fitsSchedule(s, choice, now))
    return "Choose a future session within the published lab hours.";
  if (
    existing.reduce((sum, r) => sum + r.blocks, 0) + choice.blocks >
    hours * 2
  )
    return "This session exceeds the approved hours remaining.";
  return null;
}
export const sameSession = (a: Reservation, b: Reservation) =>
  a.unit === b.unit && a.start === b.start && a.blocks === b.blocks;
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});
const timeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kolkata",
});
export const slotDay = (start: number) => dateFormat.format(start);
export const slotTime = (start: number) => timeFormat.format(start);
export const sessionLabel = (r: Reservation) =>
  slotDay(r.start) +
  ", " +
  slotTime(r.start) +
  "–" +
  slotTime(r.start + r.blocks * slotMs) +
  " IST · " +
  r.unit;
