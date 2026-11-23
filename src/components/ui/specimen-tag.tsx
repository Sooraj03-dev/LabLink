import type { ReactNode } from "react";

export function SpecimenTag({ children }: { children: ReactNode }) {
  return <span className="specimen-tag">{children}</span>;
}
