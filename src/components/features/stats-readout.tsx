"use client";
import { useRef, useEffect } from "react";
import { useMotionPreference } from "@/components/ui/motion-preference";
export function StatsReadout({
  label,
  value,
}: {
  label: string;
  value: number;
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
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span aria-hidden="true" ref={ref}>
          {value}
        </span>
        <span className="sr-only">{value}</span>
      </dd>
    </div>
  );
}
