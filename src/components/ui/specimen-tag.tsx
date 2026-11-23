"use client";
import type { ReactNode } from "react";
import { useMotionPreference } from "./motion-preference";

const statusIcons: Record<string, string> = {
  Pending: "M12 6v6l4 2",
  Approved: "M5 13l4 4L19 7",
  Rejected: "M6 6l12 12M18 6L6 18",
  Draft: "M11 4H4v14h14v-7",
};

export function SpecimenTag({ children }: { children: ReactNode }) {
  const reduced = useMotionPreference();
  const label = typeof children === "string" ? children : "";
  const icon = statusIcons[label];

  return (
    <span className="specimen-tag" data-animate={reduced ? undefined : "true"}>
      {/* Punched eyelet hole */}
      <svg
        className="tag-eyelet"
        aria-hidden="true"
        width="10"
        height="10"
        viewBox="0 0 10 10"
      >
        <circle
          cx="5"
          cy="5"
          r="3.5"
          fill="none"
          stroke="var(--control-line)"
          strokeWidth="1"
        />
        <circle cx="5" cy="5" r="1.2" fill="var(--control-line)" />
      </svg>
      {/* String connector */}
      <svg
        className="tag-string"
        aria-hidden="true"
        width="12"
        height="6"
        viewBox="0 0 12 6"
      >
        <path
          d="M0 3Q4 0 6 3T12 3"
          fill="none"
          stroke="var(--control-line)"
          strokeWidth="0.8"
        />
      </svg>
      {icon && (
        <svg
          className="tag-icon"
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={icon} />
        </svg>
      )}
      <span>{children}</span>
    </span>
  );
}
