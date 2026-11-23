import type { ReactNode } from "react";

export function BenchPanel({ children }: { children: ReactNode }) {
  return <div className="bench-panel">{children}</div>;
}
