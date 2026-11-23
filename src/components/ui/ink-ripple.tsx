"use client";
import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";
import { useMotionPreference } from "./motion-preference";

/**
 * Wraps a button to add a pointer-origin ink-drop ripple on click.
 * The ripple uses only `transform` and `opacity` for performance.
 */
export function InkRipple({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useMotionPreference();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      if (reduced || e.detail === 0) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement("span");
      ripple.className = "ink-drop";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      el.appendChild(ripple);
      const remove = () => ripple.remove();
      ripple.addEventListener("animationend", remove, { once: true });
      ripple.addEventListener("animationcancel", remove, { once: true });
    },
    [reduced],
  );

  return (
    <span
      ref={ref}
      className={"ink-ripple-host " + className}
      onClick={handleClick}
    >
      {children}
    </span>
  );
}
