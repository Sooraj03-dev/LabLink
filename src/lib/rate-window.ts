export function nextRateWindow(
  previous: { start: number; count: number } | undefined,
  now: number,
  limit: number,
) {
  const start = Math.floor(now / 60000) * 60000;
  const count = previous?.start === start ? previous.count + 1 : 1;
  return count <= limit ? { start, count } : null;
}
