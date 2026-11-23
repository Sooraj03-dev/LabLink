import { useId } from "react";

/**
 * Deterministic 7-day availability data from the sample inventory.
 * Returns an array of 7 objects: { day: "Mon", free: number, state: "free"|"busy"|"maintenance" }.
 */
export function weekAvailability(
  resourceId: string,
  totalFree: number,
): { day: string; free: number; state: "free" | "busy" | "maintenance" }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Seed a deterministic pseudo-random pattern from the resource id
  let hash = 0;
  for (let i = 0; i < resourceId.length; i++) {
    hash = ((hash << 5) - hash + resourceId.charCodeAt(i)) | 0;
  }
  return days.map((day, i) => {
    if (day === "Sat" || day === "Sun") {
      return { day, free: 0, state: "maintenance" as const };
    }
    const seed = Math.abs(hash + i * 7) % 10;
    if (totalFree === 0) {
      return { day, free: 0, state: "busy" as const };
    }
    const free = seed < 3 ? 0 : Math.min(totalFree, 1 + (seed % totalFree));
    return {
      day,
      free,
      state: free > 0 ? ("free" as const) : ("busy" as const),
    };
  });
}

/**
 * Compact 7-day availability strip SVG.
 * Uses bar height + diagonal-line pattern (not colour alone) for a11y.
 */
export function AvailabilityStrip({
  resourceId,
  totalFree,
}: {
  resourceId: string;
  totalFree: number;
}) {
  const hatch = useId();
  const slots = weekAvailability(resourceId, totalFree);
  const max = Math.max(1, ...slots.map((s) => s.free));
  const barW = 10;
  const gap = 3;
  const totalW = slots.length * (barW + gap) - gap;
  const h = 20;

  const ariaLabel = slots
    .map((s) => `${s.day}: ${s.free > 0 ? s.free + " free" : s.state}`)
    .join(", ");

  return (
    <div
      className="availability-strip"
      role="img"
      aria-label={"Sample week — " + ariaLabel}
    >
      <svg
        viewBox={`0 0 ${totalW} ${h}`}
        width={totalW * 1.5}
        height={h * 1.5}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={hatch}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="4"
              stroke="var(--control-line)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        {slots.map((slot, i) => {
          const x = i * (barW + gap);
          const barH =
            slot.state === "maintenance"
              ? h * 0.3
              : Math.max(3, (slot.free / max) * h);
          const y = h - barH;
          const fill =
            slot.state === "maintenance"
              ? "url(#" + hatch + ")"
              : slot.free > 0
                ? "var(--signal)"
                : "var(--control-line)";
          return (
            <g key={slot.day}>
              <title>{`${slot.day}: ${slot.free > 0 ? slot.free + " free" : slot.state}`}</title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="1"
                fill={fill}
                opacity={slot.state === "busy" ? 0.4 : 0.85}
              />
            </g>
          );
        })}
      </svg>
      <span className="avail-label">Sample week</span>
    </div>
  );
}
