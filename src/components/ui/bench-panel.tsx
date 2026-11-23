import type { ReactNode } from "react";

export function BenchPanel({ children }: { children: ReactNode }) {
  return (
    <div className="bench-panel">
      {/* Corner registration marks */}
      <svg
        className="reg-mark reg-tl"
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path d="M0 12V0h12" fill="none" stroke="var(--control-line)" />
      </svg>
      <svg
        className="reg-mark reg-tr"
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path d="M12 12V0H0" fill="none" stroke="var(--control-line)" />
      </svg>
      <svg
        className="reg-mark reg-bl"
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path d="M0 0v12h12" fill="none" stroke="var(--control-line)" />
      </svg>
      <svg
        className="reg-mark reg-br"
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path d="M12 0v12H0" fill="none" stroke="var(--control-line)" />
      </svg>
      {children}
    </div>
  );
}

/** Double-hairline horizontal divider between panel rows. */
export function RuleDivider() {
  return <hr className="rule-divider" aria-hidden="true" />;
}
