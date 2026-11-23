import Link from "next/link";

export default function NotFound() {
  return (
    <div className="frame inner-page">
      <div className="page-heading">
        <h1>Page unavailable</h1>
        <p className="intro">
          Check the address or find a resource in the catalogue.
        </p>
      </div>
      <Link className="button button-primary" href="/discover">
        Browse catalogue
      </Link>
    </div>
  );
}
