"use client";
import type { Resource } from "@/lib/catalogue";
import { useCompare, CompareButton, CompareTray } from "./compare-tray";
import { StaggerEntrance } from "@/components/ui/stagger-entrance";
import { ResourceCard } from "./resource-card";

/**
 * Client wrapper for the /discover catalogue results.
 * Manages compare selection, staggered entrance, and limit messages.
 */
export function CatalogueShell({
  view,
  resultKey,
  resources,
}: {
  view: "grid" | "list";
  resultKey: string;
  resources: readonly Resource[];
}) {
  const { selected, toggle, clear, isSelected, limitMsg } = useCompare();

  return (
    <>
      {resources.length > 0 ? (
        <StaggerEntrance
          as="ul"
          className={
            "resource-grid catalogue-results " +
            (view === "list" ? "list-view" : "")
          }
          key={resultKey}
          stagger={35}
          duration={220}
        >
          {resources.map((resource) => (
            <li key={resource.id}>
              <ResourceCard
                resource={resource}
                compareSlot={
                  <CompareButton
                    resource={resource}
                    checked={isSelected(resource.id)}
                    onToggle={toggle}
                  />
                }
              />
            </li>
          ))}
        </StaggerEntrance>
      ) : (
        <div className="empty-state">
          <h2>No matching resources</h2>
          <p>Try a different search term or choose fewer filters.</p>
        </div>
      )}

      <CompareTray
        selected={selected}
        onClear={clear}
        limitMessage={limitMsg}
      />
    </>
  );
}
