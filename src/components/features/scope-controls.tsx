"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useMotionPreference } from "@/components/ui/motion-preference";

const times = [0.5, 1, 2, 4, 8],
  volts = [0.25, 0.5, 1, 2, 4];
function Dial({
  x,
  label,
  unit,
  values,
  index,
  onChange,
}: {
  x: number;
  label: string;
  unit: string;
  values: number[];
  index: number;
  onChange: (i: number) => void;
}) {
  const ref = useRef<SVGGElement>(null);
  const start = useRef<{ y: number; i: number } | null>(null);
  function change(i: number) {
    onChange(Math.max(0, Math.min(values.length - 1, i)));
  }
  useEffect(() => {
    const el = ref.current;
    function wheel(e: WheelEvent) {
      if (document.activeElement !== el) return;
      e.preventDefault();
      onChange(
        Math.max(
          0,
          Math.min(values.length - 1, index + (e.deltaY < 0 ? 1 : -1)),
        ),
      );
    }
    el?.addEventListener("wheel", wheel, { passive: false });
    return () => el?.removeEventListener("wheel", wheel);
  }, [index, onChange, values.length]);
  function down(e: PointerEvent<SVGGElement>) {
    start.current = { y: e.clientY, i: index };
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  return (
    <g transform={`translate(${x} 148)`}>
      <g
        ref={ref}
        role="slider"
        tabIndex={0}
        className="scope-dial"
        aria-label={label}
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        aria-valuenow={values[index]}
        aria-valuetext={values[index] + " " + unit + " per division"}
        onPointerDown={down}
        onPointerMove={(e) => {
          if (start.current)
            change(
              start.current.i + Math.round((start.current.y - e.clientY) / 10),
            );
        }}
        onLostPointerCapture={() => {
          start.current = null;
        }}
        onKeyDown={(e) => {
          const keys: Record<string, number> = {
            ArrowRight: index + 1,
            ArrowUp: index + 1,
            ArrowLeft: index - 1,
            ArrowDown: index - 1,
            Home: 0,
            End: values.length - 1,
          };
          const value = keys[e.key];
          if (value !== undefined) {
            e.preventDefault();
            change(value);
          }
        }}
      >
        <title>{label} · drag up or use arrow keys</title>
        <circle r="18" fill="transparent" stroke="none" />
        <circle
          className="dial-ring"
          r="13"
          fill="var(--bench-shadow)"
          stroke="var(--bench-highlight)"
        />
        <path
          d="M0 0v-9"
          stroke="var(--signal)"
          strokeWidth="3"
          transform={`rotate(${-120 + index * 60})`}
        />
      </g>
    </g>
  );
}
export function ScopeControls() {
  const [time, setTime] = useState(2),
    [voltage, setVoltage] = useState(2);
  const period = 100 / (times[time] ?? 2),
    height = 18 / (volts[voltage] ?? 1);
  const trace = Array.from(
    { length: 401 },
    (_, i) =>
      (i ? "L" : "M") +
      (121 + i) +
      " " +
      (
        197 -
        Math.sin((i * 2 * Math.PI) / period) * Math.min(height, 46)
      ).toFixed(2),
  ).join(" ");
  return (
    <>
      <defs>
        <clipPath id="scope-window">
          <rect x="121" y="143" width="200" height="107" />
        </clipPath>
      </defs>
      <g clipPath="url(#scope-window)" aria-hidden="true">
        <g className="trace-sweep">
          <path
            d={trace}
            className="scope-trace"
            stroke="var(--signal)"
            fill="none"
            strokeWidth="2.4"
          />
        </g>
        <text
          key={time + "-" + voltage}
          className="screen-readout"
          x="126"
          y="244"
          stroke="none"
        >
          {times[time]} ms/div · {volts[voltage]} V/div
        </text>
      </g>
      <Dial
        x={367}
        label="Time per division"
        unit="milliseconds"
        values={times}
        index={time}
        onChange={setTime}
      />
      <Dial
        x={409}
        label="Volts per division"
        unit="volts"
        values={volts}
        index={voltage}
        onChange={setVoltage}
      />
    </>
  );
}
export function BenchPlayback() {
  const ref = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);
  const reduce = useMotionPreference();
  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>(".hero");
    if (!hero) return;
    let inView = true;
    const update = () =>
      (hero.dataset.running = String(
        inView && !document.hidden && !paused && !reduce,
      ));
    const observer = new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      update();
    });
    observer.observe(hero);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [paused, reduce]);
  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>(".hero");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    try {
      if (sessionStorage.getItem("lablink.power-on")) return;
      sessionStorage.setItem("lablink.power-on", "1");
    } catch {
      return;
    }
    hero.dataset.power = "on";
    const id = setTimeout(() => delete hero.dataset.power, 1350);
    return () => {
      clearTimeout(id);
      delete hero.dataset.power;
    };
  }, []);
  return (
    <button
      ref={ref}
      className="scope-play"
      type="button"
      aria-pressed={paused}
      disabled={reduce}
      onClick={() => setPaused(!paused)}
    >
      {reduce ? "Static trace" : paused ? "Resume trace" : "Pause trace"}
    </button>
  );
}
