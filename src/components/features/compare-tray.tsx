"use client";
import { useReducer, useRef } from "react";
import Link from "next/link";
import type { Resource } from "@/lib/catalogue";
import { useMotionPreference } from "@/components/ui/motion-preference";

const MAX_COMPARE = 3;

const empty = { selected: [] as Resource[], atLimit: false };

export function useCompare() {
  const [{ selected, atLimit }, dispatch] = useReducer(
    (state: typeof empty, resource: Resource | null) => {
      if (!resource) return empty;
      if (state.selected.some((item) => item.id === resource.id))
        return {
          selected: state.selected.filter((item) => item.id !== resource.id),
          atLimit: false,
        };
      if (state.selected.length === MAX_COMPARE)
        return { ...state, atLimit: true };
      return { selected: [...state.selected, resource], atLimit: false };
    },
    empty,
  );

  return {
    selected,
    toggle: (resource: Resource) => dispatch(resource),
    clear: () => dispatch(null),
    isSelected: (id: string) => selected.some((item) => item.id === id),
    limitMsg: atLimit ? `Compare up to ${MAX_COMPARE} resources.` : "",
  };
}

export function CompareButton({
  resource,
  checked,
  onToggle,
}: {
  resource: Resource;
  checked: boolean;
  onToggle: (r: Resource) => void;
}) {
  return (
    <button
      type="button"
      className={"compare-btn" + (checked ? " compare-btn--active" : "")}
      aria-pressed={checked}
      aria-label={"Compare " + resource.name}
      onClick={() => onToggle(resource)}
    >
      {checked ? "✕" : "+"} Compare
    </button>
  );
}

export function CompareTray({
  selected,
  onClear,
  limitMessage,
}: {
  selected: Resource[];
  onClear: () => void;
  limitMessage: string;
}) {
  const reduced = useMotionPreference();
  const dialog = useRef<HTMLDialogElement>(null);

  if (selected.length === 0) return null;

  return (
    <>
      <div
        className={"compare-tray" + (reduced ? "" : " compare-tray--animate")}
        role="region"
        aria-label="Compare bench"
      >
        <div className="compare-tray-inner frame">
          <div className="compare-tray-items">
            {selected.map((r) => (
              <span key={r.id} className="compare-chip">
                {r.name}
              </span>
            ))}
          </div>
          <div className="compare-tray-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={onClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => dialog.current?.showModal()}
              disabled={selected.length < 2}
            >
              Compare specs
            </button>
          </div>
        </div>
        <p className="compare-limit frame" role="status">
          {limitMessage}
        </p>
      </div>
      {selected.length > 1 && (
        <dialog
          className="compare-dialog"
          ref={dialog}
          aria-labelledby="compare-dialog-title"
        >
          <div className="compare-dialog-head">
            <h2 id="compare-dialog-title">Specification comparison</h2>
            <button
              type="button"
              className="button button-outline"
              onClick={() => dialog.current?.close()}
            >
              Close
            </button>
          </div>
          <div className="compare-table-wrap">
            <table className="spec-table compare-table">
              <thead>
                <tr>
                  <th scope="col">Specification</th>
                  {selected.map((r) => (
                    <th key={r.id} scope="col">
                      <Link href={"/resources/" + r.id}>{r.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Collect all unique spec labels */}
                {[
                  ...new Set(
                    selected.flatMap((r) => r.specs.map((s) => s.label)),
                  ),
                ].map((label) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((r) => {
                      const spec = r.specs.find((s) => s.label === label);
                      return <td key={r.id}>{spec?.value ?? "—"}</td>;
                    })}
                  </tr>
                ))}
                {/* Common metadata rows */}
                <tr>
                  <th scope="row">Type</th>
                  {selected.map((r) => (
                    <td key={r.id}>{r.type}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Lab</th>
                  {selected.map((r) => (
                    <td key={r.id}>{r.lab}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Department</th>
                  {selected.map((r) => (
                    <td key={r.id}>{r.department}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </dialog>
      )}
    </>
  );
}
