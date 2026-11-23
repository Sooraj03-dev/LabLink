"use client";
import { useRef, useEffect } from "react";
import { useMotionPreference } from "@/components/ui/motion-preference";

type StatusFilter = "submitted" | "approved" | "rejected";

const statusColors: Record<StatusFilter, string> = {
  submitted: "var(--signal)",
  approved: "#26694A",
  rejected: "#a53706",
};

export function StatsReadout({
  label,
  value,
  status,
  filter,
}: {
  label: string;
  value: number;
  status?: StatusFilter;
  filter?: { active: boolean; toggle: () => void };
}) {
  const ref = useRef<HTMLSpanElement>(null),
    reduced = useMotionPreference();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let raf = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 450);
        el.textContent = String(Math.round(value * (1 - (1 - t) ** 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = String(value);
    };
  }, [value, reduced]);

  const labelContent = (
    <>
      {status && (
        <span
          className="stat-dot"
          style={{ background: statusColors[status] }}
          aria-hidden="true"
        />
      )}
      {label}
    </>
  );
  return (
    <div className={filter?.active ? "stat-card--active" : undefined}>
      <dt>
        {filter ? (
          <button
            type="button"
            className="stat-card"
            aria-pressed={filter.active}
            onClick={filter.toggle}
          >
            {labelContent}
          </button>
        ) : (
          labelContent
        )}
      </dt>
      <dd>
        <span aria-hidden="true" ref={ref}>
          {value}
        </span>
        <span className="sr-only">{value}</span>
      </dd>
    </div>
  );
}
