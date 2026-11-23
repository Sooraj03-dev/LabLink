const paths = [
  "M3 7h5l2-3 4 16 3-13h4M3 17h4",
  "M4 20h13M6 18l3-8 6 3 3-7M15 5l4-2 2 4M8 10a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  "M3 19l9-9a5 5 0 0 1 6-6l-3 4 2 2 4-3a5 5 0 0 1-7 6l-8 8z",
  "M6 6h12v12H6zM9 9h6v6H9zM9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3",
  "M8 3h8m-6 0v7L4 20h16l-6-10V3M7 16h10",
  "M3 12q4-12 9 0t9 0M12 3v18M3 18h18",
  "M3 20h18M5 17V4h14v13M5 8h14m-9 0 2 4 2-4m-6 9 4-3 4 3z",
];
export function CategoryIcon({ index }: { index: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[index]} />
    </svg>
  );
}
