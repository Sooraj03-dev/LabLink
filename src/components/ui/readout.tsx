export function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="readout">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
