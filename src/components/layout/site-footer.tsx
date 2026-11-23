import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="frame footer-inner">
        <p>
          <strong>LabLink</strong>
          <span>Campus laboratory resource sharing</span>
          <small>© {new Date().getFullYear()} LabLink</small>
        </p>
        <nav aria-label="Footer">
          <Link href="/discover">Catalogue</Link>
          <Link href="/workspace">Workspace</Link>
          <a href="https://github.com/Sooraj03-dev/LabLink/issues">
            Contact the project
          </a>
          <a href="https://github.com/Sooraj03-dev/LabLink">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
