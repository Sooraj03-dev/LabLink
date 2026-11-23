import {
  requestRow,
  requestedResourceId,
  sampleRequests,
  type RequestRow,
} from "../requests";
import { coveredSlots } from "./rules";
const key = "lablink.sample.requests.v1";
export function readSamples(): RequestRow[] {
  try {
    const value = localStorage.getItem(key);
    return value ? requestRow.array().parse(JSON.parse(value)) : sampleRequests;
  } catch {
    return sampleRequests;
  }
}
export async function updateSamples(
  change: (rows: RequestRow[]) => RequestRow[],
) {
  const write = () => {
    const rows = change(readSamples());
    localStorage.setItem(key, JSON.stringify(rows));
    window.dispatchEvent(new Event("lablink-samples"));
    return rows;
  };
  if (!navigator.locks)
    throw new Error(
      "Open the demo over HTTPS or localhost to update shared sample requests.",
    );
  return navigator.locks.request(key, write);
}
export function sampleOccupancy(id: string, rows = readSamples()) {
  return rows
    .filter((row) => requestedResourceId(row) === id)
    .flatMap((row) => (row.bookings ?? []).flatMap(coveredSlots));
}
