import { sampleResources } from "./catalogue";

export const categories = [
  "Electronics",
  "Robotics",
  "Mechanical Engineering",
  "Computer Hardware",
  "Chemistry",
  "Physics",
  "3D Printing",
] as const;
// Illustrative inventory records for the public sample catalogue.
const records: Record<
  string,
  { free: number; added: string; categories: readonly string[] }
> = {
  "mixed-signal-oscilloscope": {
    free: 2,
    added: "2026-10-16",
    categories: ["Electronics", "Physics"],
  },
  "esp32-prototyping-kit": {
    free: 4,
    added: "2026-11-04",
    categories: ["Electronics", "Robotics"],
  },
  "gpu-workstation": {
    free: 0,
    added: "2026-11-10",
    categories: ["Computer Hardware", "Robotics"],
  },
  "fdm-3d-printer": {
    free: 1,
    added: "2026-10-29",
    categories: ["3D Printing", "Mechanical Engineering"],
  },
  "digital-logic-analyser": {
    free: 2,
    added: "2026-10-23",
    categories: ["Electronics"],
  },
  "fpga-development-kit": {
    free: 0,
    added: "2026-11-02",
    categories: ["Computer Hardware", "Electronics"],
  },
  "cad-workstation": {
    free: 1,
    added: "2026-11-12",
    categories: ["Mechanical Engineering", "3D Printing"],
  },
  "optical-spectrometer": {
    free: 1,
    added: "2026-11-15",
    categories: ["Physics", "Chemistry"],
  },
};
export function inventory(id: string) {
  const record = records[id];
  if (!record) throw new Error("Missing sample inventory record");
  return record;
}
export function recentResources() {
  return [...sampleResources].sort((a, b) =>
    inventory(b.id).added.localeCompare(inventory(a.id).added),
  );
}
