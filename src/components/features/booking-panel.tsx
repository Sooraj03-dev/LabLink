"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  availableStarts,
  coveredSlots,
  nextSession,
  reservationIssue,
  sameSession,
  sessionLabel,
  slotDay,
  slotTime,
  type Board,
  type Reservation,
} from "@/lib/booking/rules";
import { sampleOccupancy, updateSamples } from "@/lib/booking/sample";
import type { RequestRow } from "@/lib/requests";
import { requestedResourceId } from "@/lib/requests";
import pilot from "@/lib/booking/pilot.json";

function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const fetchState = useRef<{ active?: AbortController }>({});
  const refresh = useCallback(async () => {
    fetchState.current.active?.abort();
    const controller = new AbortController();
    fetchState.current.active = controller;
    try {
      const response = await fetch("/api/booking/" + pilot.resourceId, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const data: Board = await response.json();
      if (controller.signal.aborted) return;
      if (data.source === "browser")
        data.occupied = sampleOccupancy(pilot.resourceId);
      setBoard(data);
      setError("");
    } catch {
      if (!controller.signal.aborted) {
        setBoard(null);
        setError("Could not load the schedule.");
      }
    }
  }, []);
  useEffect(() => {
    const state = fetchState.current;
    const frame = requestAnimationFrame(() => void refresh());
    const update = () => {
      void refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") update();
    }, 60_000);
    window.addEventListener("focus", update);
    window.addEventListener("storage", update);
    window.addEventListener("lablink-samples", update);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      state.active?.abort();
      window.removeEventListener("focus", update);
      window.removeEventListener("storage", update);
      window.removeEventListener("lablink-samples", update);
    };
  }, [refresh]);
  return { board, refresh, error };
}
export function NextSession({ compact = false }: { compact?: boolean }) {
  const { board, error, refresh } = useBoard();
  if (error)
    return (
      <p>
        {error}{" "}
        <button
          type="button"
          className="text-link"
          onClick={() => void refresh()}
        >
          Retry
        </button>
      </p>
    );
  if (!board) return <p>Loading lab hours…</p>;
  const s = board.schedule;
  if (!s) return <p>Lab hours have not been published.</p>;
  const first = nextSession(board);
  const next = first
    ? "Next free half hour: " + sessionLabel(first)
    : "No free half-hour sessions in the next 14 days.";
  if (compact) return <p>{next} · Pilot schedule</p>;
  const clock = (m: number) =>
    String(Math.floor(m / 60)).padStart(2, "0") +
    ":" +
    String(m % 60).padStart(2, "0");
  return (
    <section className="booking-board">
      <p className="section-label">Pilot booking schedule</p>
      <h2>{s.model}</h2>
      <p>
        {s.lab} · {s.units.join(", ")}
      </p>
      <p>
        {s.weekdays
          .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
          .join(", ")}{" "}
        · {clock(s.openMinute)}–{clock(s.closeMinute)} IST
      </p>
      <p>{next}</p>
      <Link className="text-link" href="/workspace">
        Book with an approved request
      </Link>
    </section>
  );
}

export function BookingPanel({
  request,
  sample,
  onBooked,
  onClose,
}: {
  request: RequestRow;
  sample: boolean;
  onBooked: (bookings: Reservation[]) => void;
  onClose: () => void;
}) {
  const { board, error, refresh } = useBoard();
  const [unit, setUnit] = useState(""),
    [blocks, setBlocks] = useState(1),
    [day, setDay] = useState(""),
    [start, setStart] = useState(0);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);
  const s = board?.schedule;
  const selectedUnit = unit || s?.units[0] || "";
  const remaining =
    request.hoursNeeded -
    (request.bookings ?? []).reduce((sum, r) => sum + r.blocks / 2, 0);
  const starts =
    s && board
      ? availableStarts(s, selectedUnit, blocks, board.occupied, board.now)
      : [];
  const days = [...new Set(starts.map(slotDay))];
  const selectedDay = days.includes(day) ? day : (days[0] ?? "");
  const times = starts.filter((t) => slotDay(t) === selectedDay);
  const selectedStart = times.includes(start) ? start : 0;
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current || !s || !selectedStart) return;
    const choice = { unit: selectedUnit, blocks, start: selectedStart };
    submitting.current = true;
    setBusy(true);
    setMessage("");
    try {
      let bookings: Reservation[];
      if (sample) {
        const rows = await updateSamples((rows) => {
          const row = rows.find((r) => r.id === request.id);
          if (
            !row ||
            row.status !== "approved" ||
            requestedResourceId(row) !== s.resourceId
          )
            throw new Error("The approval is unavailable.");
          const existing = row.bookings ?? [];
          if (existing.some((r) => sameSession(r, choice))) return rows;
          const issue = reservationIssue(
            s,
            choice,
            existing,
            row.hoursNeeded,
            Date.now(),
          );
          if (issue) throw new Error(issue);
          const taken = sampleOccupancy(s.resourceId, rows);
          if (
            coveredSlots(choice).some((a) =>
              taken.some((b) => b.start === a.start && a.unit === b.unit),
            )
          )
            throw new Error(
              "This time was just reserved. Choose another session.",
            );
          return rows.map((r) =>
            r.id === row.id ? { ...r, bookings: [...existing, choice] } : r,
          );
        });
        bookings = rows.find((r) => r.id === request.id)?.bookings ?? [];
      } else {
        const res = await fetch("/api/booking/" + s.resourceId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...choice, requestId: request.id }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message ?? "Could not confirm the reservation.");
        bookings = data.bookings;
      }
      onBooked(bookings);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not confirm the reservation.",
      );
      await refresh();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="request-dialog"
      aria-labelledby="book-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <h2 id="book-title">Reserve lab time</h2>
        <p>
          {s?.model ?? request.resourceName} · {remaining} approved hours
          remaining
        </p>
        {board && !s && <p>This lab has no published schedule.</p>}
        {error && (
          <button type="button" onClick={() => void refresh()}>
            {error} Retry
          </button>
        )}
        {!board && !error && <p>Loading lab hours…</p>}
        {s && (
          <fieldset disabled={busy}>
            <label>
              Instrument unit
              <select
                value={selectedUnit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {s.units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
            <label>
              Session length
              <select
                value={blocks}
                onChange={(e) => setBlocks(Number(e.target.value))}
              >
                {[1, 2, 3, 4]
                  .filter((n) => n <= remaining * 2)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n * 30} minutes
                    </option>
                  ))}
              </select>
            </label>
            {times.length > 0 ? (
              <>
                <label>
                  Lab day
                  <select
                    value={selectedDay}
                    onChange={(e) => setDay(e.target.value)}
                  >
                    {days.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Start time (India Standard Time)
                  <select
                    value={selectedStart}
                    onChange={(e) => setStart(Number(e.target.value))}
                  >
                    <option value={0} disabled>
                      Choose a start time
                    </option>
                    {times.map((t) => (
                      <option key={t} value={t}>
                        {slotTime(t)}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedStart > 0 && (
                  <p>
                    {sessionLabel({
                      unit: selectedUnit,
                      start: selectedStart,
                      blocks,
                    })}
                  </p>
                )}
              </>
            ) : (
              <p>No sessions of this length are free in the next 14 days.</p>
            )}
          </fieldset>
        )}
        {message && <p role="alert">{message}</p>}
        <div className="workspace-toolbar">
          <button
            className="button button-primary"
            disabled={busy || !selectedStart || blocks > remaining * 2}
          >
            {busy ? "Reserving…" : "Confirm reservation"}
          </button>
          <button
            className="button button-outline"
            type="button"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Close
          </button>
        </div>
      </form>
    </dialog>
  );
}
