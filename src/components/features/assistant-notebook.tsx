"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { AssistantMode, AssistantResult } from "@/lib/assistant";

type Choice = {
  id: string;
  name: string;
  specs: readonly { label: string; value: string }[];
};
export function AssistantNotebook({
  initialMode,
  initialResource,
  resources,
}: {
  initialMode: AssistantMode;
  initialResource?: string;
  resources: Choice[];
}) {
  const [mode, setMode] = useState(initialMode);
  const [resource, setResource] = useState(
    initialResource ?? resources[0]?.id ?? "",
  );
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const selected = resources.find((item) => item.id === resource);
  function reset() {
    setResult(null);
    setError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current) return;
    active.current = true;
    setBusy(true);
    reset();
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          description,
          deadline: mode === "plan" && deadline ? deadline : undefined,
          resourceId: mode === "compare" ? resource : undefined,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error();
      setResult(await response.json());
    } catch {
      setError(
        "Could not reach the assistant. Try again or browse the catalogue.",
      );
    } finally {
      active.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="assistant-layout">
      <form className="assistant-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>
            What would you like to do?
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as AssistantMode);
                reset();
              }}
            >
              <option value="search">Find equipment</option>
              <option value="plan">Plan a project</option>
              <option value="compare">Compare alternatives</option>
            </select>
          </label>
          {mode === "compare" && (
            <label>
              Reference equipment
              <select
                value={resource}
                onChange={(e) => {
                  setResource(e.target.value);
                  reset();
                }}
              >
                {resources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {mode === "plan"
              ? "Project description"
              : mode === "compare"
                ? "What does the alternative need to do? (optional)"
                : "What do you need?"}
            <textarea
              value={description}
              rows={4}
              maxLength={1200}
              required={mode !== "compare"}
              minLength={mode === "compare" ? undefined : 4}
              onChange={(e) => {
                setDescription(e.target.value);
                reset();
              }}
              placeholder="For example, a board with Bluetooth for a wireless sensor"
            />
          </label>
          {mode === "plan" && (
            <label>
              Project deadline (optional)
              <input
                type="date"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  reset();
                }}
              />
            </label>
          )}
          <p className="muted">
            Live requests send this description to Google Gemini. Leave out
            names and contact details.
          </p>
          <button className="button button-primary" type="submit">
            {busy
              ? "Checking the catalogue…"
              : mode === "plan"
                ? "Build resource plan"
                : mode === "compare"
                  ? "Find alternatives"
                  : "Find matches"}
          </button>
        </fieldset>
      </form>
      <section
        className="assistant-results"
        aria-labelledby="assistant-results-title"
        aria-busy={busy}
      >
        <h2 id="assistant-results-title">
          {mode === "plan"
            ? "Resource plan"
            : mode === "compare"
              ? "Equipment comparison"
              : "Matching equipment"}
        </h2>
        <p role="status">
          {busy
            ? "Searching…"
            : error || result?.notice || "Your results will appear here."}
        </p>
        {result && (
          <>
            {mode === "plan" && deadline && (
              <p>
                Target date <time dateTime={deadline}>{deadline}</time>. Confirm
                dates with the lab.
              </p>
            )}
            {mode === "compare" && selected && (
              <p>
                <strong>{selected.name}</strong> ·{" "}
                {selected.specs.map((s) => s.label + " " + s.value).join(" · ")}
              </p>
            )}
            {result.matches.length ? (
              <ol>
                {result.matches.map((item) => (
                  <li key={item.id}>
                    <h3>
                      <Link href={"/resources/" + item.id}>{item.name}</Link>
                    </h3>
                    <p>
                      {item.lab} · {item.department}
                    </p>
                    <p>
                      <strong>{item.spec.label}</strong> · {item.spec.value}
                    </p>
                    <p>
                      {item.free} sample units available
                      {item.hours !== null
                        ? " · Estimated lab time: " + item.hours + " h"
                        : ""}
                    </p>
                    <Link
                      className="text-link"
                      href={"/workspace?resource=" + item.id}
                    >
                      Start an access request
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                No catalogue items match these requirements. Try a broader
                description.
              </p>
            )}
            <p className="muted">
              Availability is a sample inventory count. Confirm compatibility
              and time slots with the lab.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
