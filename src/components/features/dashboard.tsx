"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Role } from "@/lib/auth";
import { sampleResources } from "@/lib/catalogue";
import {
  requestInput,
  requestedResourceId,
  type RequestRow,
} from "@/lib/requests";
import {
  saveRequest,
  reviewRequest,
  submitDraft,
} from "@/app/workspace/actions";
import { RecentViews } from "./recent-views";
import { readSamples, updateSamples } from "@/lib/booking/sample";
import { BookingPanel } from "./booking-panel";
import pilot from "@/lib/booking/pilot.json";
import { sessionLabel } from "@/lib/booking/rules";
import { AccountControls } from "./account-controls";

const labels = {
  draft: "Draft",
  submitted: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
interface Props {
  name: string;
  role: Role;
  sample: boolean;
  emulator: boolean;
  initial: RequestRow[];
  resourceId?: string;
  review?: boolean;
}
export function Dashboard({
  name,
  role,
  sample,
  emulator,
  initial,
  resourceId,
  review = false,
}: Props) {
  const [rows, setRows] = useState(initial);
  const [booking, setBooking] = useState<RequestRow | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const formDialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef("");
  useEffect(() => {
    function refresh() {
      if (sample) setRows(readSamples());
    }
    const frame = requestAnimationFrame(refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", refresh);
    };
  }, [sample]);
  function openForm() {
    requestId.current = crypto.randomUUID();
    setError("");
    formDialog.current?.showModal();
  }
  useEffect(() => {
    if (resourceId && sampleResources.some((r) => r.id === resourceId)) {
      requestId.current = crypto.randomUUID();
      formDialog.current?.showModal();
    }
  }, [resourceId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = requestInput.safeParse(Object.fromEntries(new FormData(form)));
    if (!data.success) {
      setError(
        "Choose a resource, enter a project title of at least 3 characters and request 1–40 hours.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const item = sampleResources.find((r) => r.id === data.data.resourceId);
      if (!item) throw new Error();
      const row: RequestRow = sample
        ? {
            id: requestId.current,
            projectTitle: data.data.projectTitle,
            resourceName: item.name,
            resourceId: item.id,
            hoursNeeded: data.data.hoursNeeded,
            status: "submitted",
          }
        : await saveRequest(data.data, requestId.current);
      const append = (items: RequestRow[]) => [
        row,
        ...items.filter((x) => x.id !== row.id),
      ];
      const next = sample ? await updateSamples(append) : append(rows);
      setRows(next);
      setStatus("all");
      formDialog.current?.close();
      form.reset();
      setMessage(
        row.status === "draft"
          ? "Draft saved. This sample resource needs a campus reviewer before submission."
          : "Request sent for review.",
      );
    } catch {
      setError("Could not save the request. Your entries are still here.");
    } finally {
      setBusy(false);
    }
  }
  async function decide(id: string, outcome: "approved" | "rejected") {
    setBusy(true);
    try {
      if (!sample) await reviewRequest(id, outcome);
      const update = (items: RequestRow[]) =>
        items.map((row) => (row.id === id ? { ...row, status: outcome } : row));
      const next = sample ? await updateSamples(update) : update(rows);
      setRows(next);
      setMessage("Request " + outcome + ".");
    } catch {
      setMessage(
        "Could not update the request. Refresh the queue and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function sendDraft(id: string) {
    setBusy(true);
    try {
      if (await submitDraft(id)) {
        setRows((items) =>
          items.map((r) => (r.id === id ? { ...r, status: "submitted" } : r)),
        );
        setMessage("Request sent for review.");
      } else {
        setMessage("The lab still needs an assigned reviewer.");
      }
    } catch {
      setMessage("Could not submit this draft.");
    } finally {
      setBusy(false);
    }
  }
  const visible = rows.filter((r) =>
    review ? r.status === "submitted" : status === "all" || status === r.status,
  );
  return (
    <div className="frame inner-page dashboard">
      <div className="page-heading">
        <p className="section-label">{role} workspace</p>
        <h1>{review ? "Approvals" : "My workspace"}</h1>
        <p className="intro">
          {review
            ? "Review project requests assigned to you."
            : "Welcome, " + name + "."}
        </p>
      </div>
      <div className="workspace-toolbar">
        {!review && (
          <button className="button button-primary" onClick={openForm}>
            Request equipment
          </button>
        )}
        <Link className="button button-outline" href="/discover">
          Browse catalogue
        </Link>
        <Link className="text-link" href="/assistant?mode=plan">
          Plan equipment with AI
        </Link>
        {role !== "student" && (
          <Link
            className="text-link"
            href={review ? "/workspace" : "/approvals"}
          >
            {review ? "My workspace" : "View approvals"}
          </Link>
        )}
      </div>
      <dl className="stat-strip">
        {(["submitted", "approved", "rejected"] as const).map((key) => (
          <div key={key}>
            <dt>{labels[key]}</dt>
            <dd>{rows.filter((r) => r.status === key).length}</dd>
          </div>
        ))}
      </dl>
      <section className="dash-section">
        <div className="section-head">
          <h2>{review ? "Pending requests" : "My equipment requests"}</h2>
          {!review && (
            <label>
              Show{" "}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All requests</option>
                {Object.entries(labels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {visible.length ? (
          <ul className="request-list">
            {visible.map((row) => (
              <li key={row.id}>
                <div>
                  <strong>{row.projectTitle}</strong>
                  <p>
                    {row.resourceName} · {row.hoursNeeded} hours
                  </p>
                </div>
                <span className="specimen-tag">{labels[row.status]}</span>
                {!review && !sample && row.status === "draft" && (
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => void sendDraft(row.id)}
                  >
                    Send for review
                  </button>
                )}
                {!review &&
                  row.status === "approved" &&
                  requestedResourceId(row) === pilot.resourceId && (
                    <>
                      {row.bookings?.length ? (
                        <ul aria-label="Reserved lab sessions">
                          {row.bookings.map((b) => (
                            <li key={b.unit + b.start}>
                              Reserved · {sessionLabel(b)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {(row.bookings ?? []).reduce(
                        (sum, r) => sum + r.blocks / 2,
                        0,
                      ) < row.hoursNeeded && (
                        <button
                          className="button button-outline"
                          onClick={() => setBooking(row)}
                        >
                          Book lab time
                        </button>
                      )}
                    </>
                  )}
                {review && (
                  <div className="decision-buttons">
                    <button
                      disabled={busy}
                      onClick={() => void decide(row.id, "approved")}
                      className="button button-outline"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => void decide(row.id, "rejected")}
                      className="text-link"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">
            {review
              ? "Your review queue is clear."
              : "There are no matching requests yet."}
          </p>
        )}
      </section>
      {!review && (
        <div className="detail-grid">
          <section className="dash-section">
            <h2>Project workspace</h2>
            {rows.length ? (
              <ul>
                {[...new Set(rows.map((r) => r.projectTitle))].map((title) => (
                  <li key={title}>
                    {title} ·{" "}
                    {rows.filter((r) => r.projectTitle === title).length}{" "}
                    request(s)
                  </li>
                ))}
              </ul>
            ) : (
              <p>Start an equipment request to add a project here.</p>
            )}
          </section>
          <RecentViews />
        </div>
      )}
      <p role="status" className={message ? "status-notice" : ""}>
        {message && (
          <>
            {!message.startsWith("Could not") && (
              <b className="logged">Logged </b>
            )}{" "}
            {message}
          </>
        )}
      </p>
      {booking && (
        <BookingPanel
          request={booking}
          sample={sample}
          onClose={() => setBooking(null)}
          onBooked={(bookings) => {
            setRows((items) =>
              items.map((r) => (r.id === booking.id ? { ...r, bookings } : r)),
            );
            setMessage("Lab session reserved.");
            setBooking(null);
          }}
        />
      )}
      <AccountControls demo={sample || emulator} />
      <dialog
        ref={formDialog}
        aria-labelledby="request-heading"
        className="request-dialog"
      >
        <form onSubmit={submit}>
          <h2 id="request-heading">Request equipment</h2>
          <label>
            Project title
            <input name="projectTitle" required minLength={3} maxLength={100} />
          </label>
          <label>
            Equipment
            <select name="resourceId" defaultValue={resourceId || ""} required>
              <option value="">Choose equipment</option>
              {sampleResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hours needed
            <input
              name="hoursNeeded"
              type="number"
              min={1}
              max={40}
              defaultValue={1}
              required
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="workspace-toolbar">
            <button disabled={busy} className="button button-primary">
              {busy ? "Saving…" : "Save request"}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => formDialog.current?.close()}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
