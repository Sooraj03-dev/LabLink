import { describe, it, expect } from "vitest";
import record from "../../src/lib/booking/pilot.json";
import {
  scheduleSchema,
  availableStarts,
  coveredSlots,
  fitsSchedule,
  horizon,
  remainingHours,
  nextSession,
  reservationIssue,
  slotMs,
} from "../../src/lib/booking/rules";
const pilot = scheduleSchema.parse(record);
const hour = (s: string) => Date.parse(s + "+05:30");
const now = hour("2026-11-23T08:00");
const one = { unit: "scope-01", start: hour("2026-11-23T09:00"), blocks: 2 };
describe("pilot reservation rules", () => {
  it("keeps the picker and reservation limit on the same half-hour budget", () => {
    expect(remainingHours(2)).toBe(2);
    const existing = [{ ...one, blocks: 3 }];
    expect(remainingHours(2, existing)).toBe(0.5);
    expect(
      reservationIssue(pilot, { ...one, blocks: 1 }, existing, 2, now),
    ).toBeNull();
    expect(reservationIssue(pilot, one, existing, 2, now)).toMatch(
      /approved hours/,
    );
  });
  it("uses campus time for opening, closing, weekends and the 14-day window", () => {
    expect(fitsSchedule(pilot, one, now)).toBe(true);
    for (const time of [
      "2026-11-23T08:30",
      "2026-11-23T16:30",
      "2026-11-23T09:15",
      "2026-11-28T10:00",
      "2026-12-07T09:00",
    ]) {
      expect(fitsSchedule(pilot, { ...one, start: hour(time) }, now)).toBe(
        false,
      );
    }
    expect(fitsSchedule(pilot, one, one.start)).toBe(false);
    expect(horizon(now).end).toBe(hour("2026-12-07T00:00"));
  });
  it("accounts for partial overlaps on each unit and the remaining approved hours", () => {
    const schedule = {
      ...pilot,
      timeZone: "Asia/Kolkata" as const,
      units: ["scope-01", "scope-02"],
    };
    const occupied = coveredSlots(one);
    expect(
      nextSession({ schedule, occupied, now, source: "emulator" }),
    ).toEqual({
      start: one.start,
      unit: "scope-02",
      blocks: 1,
    });
    const free = availableStarts(schedule, "scope-01", 2, occupied, now);
    expect(free[0]).toBe(one.start + 2 * slotMs);
    expect(availableStarts(schedule, "scope-02", 2, occupied, now)[0]).toBe(
      one.start,
    );
    expect(reservationIssue(schedule, one, [one], 1.5, now)).toMatch(
      /approved hours/,
    );
    expect(fitsSchedule(schedule, { ...one, unit: "missing" }, now)).toBe(
      false,
    );
  });
});
