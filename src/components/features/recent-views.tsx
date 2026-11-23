"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sampleResources } from "@/lib/catalogue";

function readIds(): string[] {
  try {
    const ids: unknown = JSON.parse(
      sessionStorage.getItem("lablink.views") || "[]",
    );
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
export function TrackView({ id }: { id: string }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "lablink.views",
        JSON.stringify([id, ...readIds().filter((x) => x !== id)].slice(0, 5)),
      );
    } catch {
      /* Browsing still works when session storage is disabled. */
    }
  }, [id]);
  return null;
}
export function RecentViews() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIds(readIds()));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <section className="dash-section">
      <h2>Recently viewed</h2>
      {ids.length ? (
        <ul>
          {ids.map((id) => {
            const resource = sampleResources.find((r) => r.id === id);
            return resource ? (
              <li key={id}>
                <Link className="text-link" href={"/resources/" + id}>
                  {resource.name}
                </Link>
              </li>
            ) : null;
          })}
        </ul>
      ) : (
        <p>Your equipment history appears here as you browse.</p>
      )}
    </section>
  );
}
