"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function SiteHeader() {
  const [open, setOpen] = useState(false),
    [scrolled, setScrolled] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const items = [
    ["Home", "/"],
    ["Browse catalogue", "/discover"],
    ["How it works", "/#how-it-works"],
    ["About", "/#about"],
    ["My workspace", "/workspace"],
    ["Log in / Sign up", "/login"],
  ];
  return (
    <header
      className="site-header"
      data-scrolled={scrolled}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <div className="frame header-inner">
        <Link prefetch={false} className="wordmark" href="/">
          <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
            <rect width="36" height="36" rx="2" fill="currentColor" />
            <path
              d="M14 8h8m-6 0v8l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V8m-7 15h10"
              className="wordmark-flask"
              fill="none"
              strokeWidth="1.9"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <span>LabLink</span>
        </Link>
        <noscript>
          <style>{`@media (max-width:54rem){.site-header .menu-toggle{display:none}.site-header .site-nav{display:flex;width:100%;flex-wrap:wrap}.site-header{position:static}}`}</style>
        </noscript>
        <button
          type="button"
          className="button menu-toggle"
          ref={button}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close menu" : "Menu"}
        </button>
        <nav
          className="site-nav"
          id="main-nav"
          data-open={open}
          aria-label="Main navigation"
        >
          {items.map(([label, href]) => (
            <Link
              prefetch={false}
              key={label}
              href={href || "/"}
              aria-current={path === href ? "page" : undefined}
              className={
                href === "/login" ? "button button-outline" : undefined
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
