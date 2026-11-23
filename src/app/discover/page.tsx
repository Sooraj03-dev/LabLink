import type { Metadata } from "next";
import Link from "next/link";
import { ResourceCard } from "@/components/features/resource-card";
import {
  approvalLabels,
  departments,
  filterResources,
  parseCatalogueFilters,
  resourceTypes,
  sampleResources,
  type SearchParams,
} from "@/lib/catalogue";

export const metadata: Metadata = { title: "Resource catalogue" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseCatalogueFilters(await searchParams);
  const resources = filterResources(sampleResources, filters);

  return (
    <div className="frame inner-page">
      <div className="page-heading">
        <p className="eyebrow">Sample catalogue</p>
        <h1>Resource catalogue</h1>
        <p className="intro">
          Explore example equipment, kits and workstations. Availability will
          appear once campus labs are connected.
        </p>
      </div>

      <form
        className="filters"
        action="/discover"
        method="get"
        role="search"
        aria-label="Resource catalogue"
      >
        <label className="filter-search">
          Search
          <input
            name="q"
            type="search"
            maxLength={120}
            defaultValue={filters.query}
            placeholder="Try 200 MHz or ESP32"
          />
        </label>
        <label>
          Department
          <select name="department" defaultValue={filters.department}>
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
        </label>
        <label>
          Resource type
          <select name="type" defaultValue={filters.type}>
            <option value="">All types</option>
            {Object.entries(resourceTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Approval
          <select name="approval" defaultValue={filters.approval}>
            <option value="">Any approval</option>
            {Object.entries(approvalLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-primary" type="submit">
          Apply filters
        </button>
      </form>

      <div className="results-heading">
        <p>
          {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </p>
        {(filters.query ||
          filters.type ||
          filters.department ||
          filters.approval) && (
          <Link className="text-link" href="/discover">
            Clear filters
          </Link>
        )}
      </div>
      {resources.length > 0 ? (
        <ul className="resource-grid">
          {resources.map((resource) => (
            <li key={resource.id}>
              <ResourceCard resource={resource} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <h2>No matching resources</h2>
          <p>Try a different search term or choose fewer filters.</p>
        </div>
      )}
    </div>
  );
}
