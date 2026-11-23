import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { database, clientConfig, emulatorMode } from "./firebase";
import { currentUser } from "./session";
import { sampleRole } from "./sample-session";
import pilot from "@/lib/booking/pilot.json";
import {
  bookingInput,
  coveredSlots,
  horizon,
  reservationIssue,
  sameSession,
  scheduleSchema,
  slotMs,
  type Board,
  type Reservation,
} from "@/lib/booking/rules";
import { requestRow, requestedResourceId } from "@/lib/requests";

export async function availability(id: string): Promise<Board> {
  const now = Date.now();
  if (id !== pilot.resourceId)
    return { source: "campus", now, occupied: [], schedule: null };
  if ((await sampleRole()) && !(await currentUser()))
    return {
      source: "browser",
      now,
      occupied: [],
      schedule: scheduleSchema.parse(pilot),
    };
  const source = emulatorMode() ? "emulator" : "campus";
  if (!clientConfig()) return { source, now, occupied: [], schedule: null };
  const resource = database().collection("resources").doc(id);
  const data = await resource.get();
  const schedule = scheduleSchema.safeParse(data.get("bookingSchedule"));
  if (!schedule.success || schedule.data.resourceId !== id)
    return { source, now, occupied: [], schedule: null };
  const slots = await resource
    .collection("bookingSlots")
    .where("start", ">=", now)
    .where("start", "<", horizon(now).end)
    .get();
  return {
    source,
    now,
    schedule: schedule.data,
    occupied: slots.docs.map((doc) => ({
      unit: doc.get("unit") as string,
      start: doc.get("start") as number,
    })),
  };
}

type Outcome =
  | { status: 200; bookings: Reservation[] }
  | { status: 400 | 403 | 404 | 409; message: string };
export async function reserve(
  id: string,
  uid: string,
  body: unknown,
): Promise<Outcome> {
  const parsed = bookingInput.safeParse(body);
  if (!parsed.success || id !== pilot.resourceId)
    return { status: 400, message: "Choose a valid instrument and session." };
  const { requestId, ...choice } = parsed.data;
  const db = database();
  const grant = db.collection("accessRequests").doc(requestId);
  const resource = db.collection("resources").doc(id);
  return db.runTransaction(async (tx) => {
    const [access, instrument] = await Promise.all([
      tx.get(grant),
      tx.get(resource),
    ]);
    if (
      !access.exists ||
      access.get("requesterId") !== uid ||
      access.get("status") !== "approved"
    )
      return {
        status: 403,
        message: "An approved request of your own is required.",
      };
    const row = requestRow.parse({ ...access.data(), id: access.id });
    if (requestedResourceId(row) !== id)
      return {
        status: 403,
        message: "This approval is for another instrument.",
      };
    const existing = row.bookings ?? [];
    if (existing.some((r) => sameSession(r, choice)))
      return { status: 200, bookings: existing };
    const configured = scheduleSchema.safeParse(
      instrument.get("bookingSchedule"),
    );
    if (!configured.success || configured.data.resourceId !== id)
      return { status: 404, message: "This lab has no published schedule." };
    const issue = reservationIssue(
      configured.data,
      choice,
      existing,
      row.hoursNeeded,
      Date.now(),
    );
    if (issue) return { status: 400, message: issue };
    const slots = coveredSlots(choice);
    const guards = slots.map((slot) =>
      resource.collection("bookingSlots").doc(slot.unit + "_" + slot.start),
    );
    const locks = await tx.getAll(...guards);
    if (locks.some((doc) => doc.exists))
      return {
        status: 409,
        message: "Another student reserved this time. Choose another session.",
      };
    guards.forEach((ref, i) =>
      tx.create(ref, {
        ...slots[i],
        requestId,
        expiresAt: Timestamp.fromMillis(
          choice.start + choice.blocks * slotMs + 30 * 86400000,
        ),
      }),
    );
    const bookings = [...existing, choice];
    tx.update(grant, { bookings, lastBookedAt: FieldValue.serverTimestamp() });
    return { status: 200, bookings };
  });
}
