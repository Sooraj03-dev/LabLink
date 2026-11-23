export default function Loading() {
  return (
    <div className="frame inner-page">
      <p role="status">Loading catalogue…</p>
      <div className="loading-rack" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
