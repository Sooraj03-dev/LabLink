import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="frame header-inner">
        <Link className="wordmark" href="/">
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
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/workspace">My workspace</Link>
          <Link className="button button-outline" href="/discover">
            Browse catalogue
          </Link>
        </nav>
      </div>
    </header>
  );
}
