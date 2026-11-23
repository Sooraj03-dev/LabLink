"use client";
import { useMotionPreference } from "./motion-preference";

/**
 * Reagent-green confirmation stamp with spring-in animation.
 * Displayed inside the workspace's status region.
 */
export function ConfirmationStamp() {
  const reduced = useMotionPreference();

  return (
    <span
      className={
        "confirmation-stamp" + (reduced ? "" : " confirmation-stamp--animate")
      }
      aria-hidden="true"
    >
      {/* Green burst dots */}
      <svg
        className="stamp-burst"
        aria-hidden="true"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={deg}
            cx={16 + 12 * Math.cos((deg * Math.PI) / 180)}
            cy={16 + 12 * Math.sin((deg * Math.PI) / 180)}
            r="2"
            fill="#26694A"
          />
        ))}
      </svg>
      <span className="stamp-text">Logged</span>
    </span>
  );
}
