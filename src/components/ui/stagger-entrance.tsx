"use client";
import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { useMotionPreference } from "./motion-preference";

/**
 * Wraps children in a container that applies a staggered "instrument boot"
 * entrance animation. Each direct child gets an incremental delay.
 *
 * Animates `opacity` and `transform` only.
 */
export function StaggerEntrance({
  children,
  stagger = 40,
  duration = 220,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  stagger?: number;
  duration?: number;
  as?: "div" | "ul" | "dl" | "section";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useMotionPreference();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const kids = Array.from(el.children) as HTMLElement[];
    kids.forEach((child) => {
      child.style.opacity = "0";
      child.style.transform = "translateY(8px)";
    });

    // Use IntersectionObserver so animation fires when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        kids.forEach((child, i) => {
          const delay = i * stagger;
          child.style.transition = `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`;
          child.style.opacity = "1";
          child.style.transform = "translateY(0)";
        });
      },
      { threshold: 0 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      kids.forEach((child) => {
        child.style.opacity = "";
        child.style.transform = "";
        child.style.transition = "";
      });
    };
  }, [reduced, stagger, duration]);

  const style: CSSProperties | undefined = reduced
    ? undefined
    : { willChange: "contents" };

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}
