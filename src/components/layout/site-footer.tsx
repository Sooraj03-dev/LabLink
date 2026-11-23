import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="frame footer-inner">
        <p>
          <strong>LabLink</strong>{" "}
          <span>Campus laboratory resource sharing</span>
        </p>
        <Link href="/discover">Browse catalogue</Link>
      </div>
    </footer>
  );
}
