"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Role } from "@/lib/auth";
import { sampleResources } from "@/lib/catalogue";
import {
  requestInput,
  requestedResourceId,
  resolveReview,
  type ReviewDecision,
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
import { remainingHours, sessionLabel } from "@/lib/booking/rules";
import { AccountControls } from "./account-controls";
import { StatsReadout } from "./stats-readout";
import { SpecimenTag } from "@/components/ui/specimen-tag";
import { BenchPanel, RuleDivider } from "@/components/ui/bench-panel";
import { StaggerEntrance } from "@/components/ui/stagger-entrance";
import { ConfirmationStamp } from "@/components/ui/confirmation-stamp";
import { InkRipple } from "@/components/ui/ink-ripple";

const labels = {
  draft: "Draft",
  submitted: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

type StatusFilter = RequestRow["status"];

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
  const [bookingId, setBookingId] = useState<string | null>(null);
  const booking = rows.find((row) => row.id === bookingId);
  const [message, setMessage] = useState("");
  const [stampKey, setStampKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"all" | StatusFilter>("all");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  function triggerStamp(msg: string) {
    setMessage(msg);
    setStampKey((k) => k + 1);
  }
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
      if (sample) {
        setRows(
          await updateSamples((items) =>
            items.some((item) => item.id === row.id) ? items : append(items),
          ),
        );
      } else {
        setRows(append);
      }
      setStatus("all");
      formDialog.current?.close();
      form.reset();
      triggerStamp(
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
  async function decide(id: string, outcome: ReviewDecision) {
    setBusy(true);
    try {
      let decision: ReviewDecision;
      if (sample) {
        const next = await updateSamples((items) =>
          items.map((row) =>
            row.id === id
              ? { ...row, status: resolveReview(row.status, outcome) }
              : row,
          ),
        );
        const saved = next.find((row) => row.id === id);
        if (!saved) throw new Error("Unknown request.");
        decision = resolveReview(saved.status, outcome);
        setRows(next);
      } else {
        decision = await reviewRequest(id, outcome);
        setRows((items) =>
          items.map((row) =>
            row.id === id ? { ...row, status: decision } : row,
          ),
        );
      }
      triggerStamp(
        decision === outcome
          ? "Request " + decision + "."
          : "Request already " + decision + ".",
      );
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
        triggerStamp("Request sent for review.");
      } else {
        setMessage("The lab still needs an assigned reviewer.");
      }
    } catch {
      setMessage("Could not submit this draft.");
    } finally {
      setBusy(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const visible = rows.filter((r) =>
    review ? r.status === "submitted" : status === "all" || status === r.status,
  );

  const isExpanded = (id: string) => expandedId === id;

  return (
    <div className="frame inner-page dashboard app-grid-bg">
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
          <InkRipple>
            <button className="button button-primary" onClick={openForm}>
              Request equipment
            </button>
          </InkRipple>
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
      <StaggerEntrance
        as="dl"
        className="stat-strip"
        stagger={60}
        duration={260}
      >
        {(["submitted", "approved", "rejected"] as const).map((key) => (
          <StatsReadout
            key={key}
            label={labels[key]}
            value={rows.filter((r) => r.status === key).length}
            status={key}
            filter={
              review
                ? undefined
                : {
                    active: status === key,
                    toggle: () =>
                      setStatus((current) => (current === key ? "all" : key)),
                  }
            }
          />
        ))}
      </StaggerEntrance>
      <BenchPanel>
        <section className="dash-section-inner">
          <div className="section-head">
            <h2>{review ? "Pending requests" : "My equipment requests"}</h2>
            {!review && (
              <label>
                Show{" "}
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "all" | StatusFilter)
                  }
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
            <StaggerEntrance
              as="ul"
              className="request-list"
              stagger={40}
              duration={220}
            >
              {visible.map((row) => {
                const resourceId = requestedResourceId(row);
                return (
                  <li
                    key={row.id}
                    className={
                      "request-row" +
                      (isExpanded(row.id) ? " request-row--expanded" : "")
                    }
                  >
                    <div className="request-row-main">
                      <button
                        type="button"
                        className="request-row-toggle"
                        onClick={() => toggleExpand(row.id)}
                        aria-expanded={isExpanded(row.id)}
                        aria-controls={"detail-" + row.id}
                      >
                        <strong>{row.projectTitle}</strong>
                        <span>
                          {row.resourceName} · {row.hoursNeeded} hours
                        </span>
                      </button>
                      <SpecimenTag>{labels[row.status]}</SpecimenTag>
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
                        resourceId === pilot.resourceId && (
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
                            {remainingHours(row.hoursNeeded, row.bookings) >
                              0 && (
                              <button
                                className="button button-outline"
                                onClick={() => setBookingId(row.id)}
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
                    </div>
                    {/* Expandable detail panel */}
                    <div
                      id={"detail-" + row.id}
                      className="request-detail"
                      data-open={isExpanded(row.id) ? "true" : undefined}
                      inert={!isExpanded(row.id)}
                    >
                      <RuleDivider />
                      <div className="detail-content">
                        <dl className="detail-specs">
                          <div>
                            <dt>Resource</dt>
                            <dd>{row.resourceName}</dd>
                          </div>
                          <div>
                            <dt>Hours requested</dt>
                            <dd>{row.hoursNeeded}</dd>
                          </div>
                          <div>
                            <dt>Status</dt>
                            <dd>{labels[row.status]}</dd>
                          </div>
                        </dl>
                        <div className="detail-actions">
                          {resourceId && (
                            <Link
                              className="text-link"
                              href={"/resources/" + resourceId}
                            >
                              View instrument
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </StaggerEntrance>
          ) : (
            <p className="empty-state">
              {review
                ? "Your review queue is clear."
                : "There are no matching requests yet."}
            </p>
          )}
        </section>
      </BenchPanel>
      {!review && (
        <div className="detail-grid">
          <BenchPanel>
            <section className="dash-section-inner">
              <h2>Project workspace</h2>
              {rows.length ? (
                <ul>
                  {[...new Set(rows.map((r) => r.projectTitle))].map(
                    (title) => (
                      <li key={title}>
                        {title} ·{" "}
                        {rows.filter((r) => r.projectTitle === title).length}{" "}
                        request(s)
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p>Start an equipment request to add a project here.</p>
              )}
            </section>
          </BenchPanel>
          <RecentViews />
        </div>
      )}
      <p
        role="status"
        aria-live="polite"
        className={message ? "status-notice" : ""}
      >
        {message && (
          <>
            {!message.startsWith("Could not") &&
              !message.startsWith("The lab") && (
                <ConfirmationStamp key={stampKey} />
              )}{" "}
            {message}
          </>
        )}
      </p>
      {booking && (
        <BookingPanel
          request={booking}
          sample={sample}
          onClose={() => setBookingId(null)}
          onBooked={(bookings) => {
            setRows((items) =>
              items.map((r) => (r.id === booking.id ? { ...r, bookings } : r)),
            );
            triggerStamp("Lab session reserved.");
            setBookingId(null);
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
