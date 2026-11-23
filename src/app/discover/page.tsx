import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { categories, inventory } from "@/lib/inventory";
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
  const params = await searchParams;
  const filters = parseCatalogueFilters(params);
  const category = categories.find((item) => item === params.category) ?? "";
  const availability =
    params.availability === "free"
      ? "free"
      : params.availability === "busy"
        ? "busy"
        : "";
  const sort =
    params.sort === "recent" ? "recent" : params.sort === "name" ? "name" : "";
  const view = params.view === "list" ? "list" : "grid";
  const resources = filterResources(sampleResources, filters).filter((r) => {
    const stock = inventory(r.id);
    return (
      (!category || stock.categories.includes(category)) &&
      (!availability ||
        (availability === "free" ? stock.free > 0 : stock.free === 0))
    );
  });
  if (sort === "recent")
    resources.sort((a, b) =>
      inventory(b.id).added.localeCompare(inventory(a.id).added),
    );
  if (sort === "name") resources.sort((a, b) => a.name.localeCompare(b.name));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({
    q: filters.query,
    type: filters.type,
    department: filters.department,
    approval: filters.approval,
    category,
    availability,
    sort,
  })) {
    if (value) query.set(key, value);
  }
  const active = query.toString();

  return (
    <div className="frame inner-page">
      <div className="page-heading">
        <p className="section-label">Sample catalogue</p>
        <h1>Resource catalogue</h1>
        <p className="intro">
          Compare equipment, kits and workstations across campus. Availability
          reflects the sample inventory.
        </p>
      </div>

      <Form
        className="filters"
        action="/discover"
        key={"filters:" + active + view}
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
        <label>
          Field
          <select name="category" defaultValue={category}>
            <option value="">All fields</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Availability
          <select name="availability" defaultValue={availability}>
            <option value="">Any availability</option>
            <option value="free">Available</option>
            <option value="busy">In use</option>
          </select>
        </label>
        <label>
          Sort by
          <select name="sort" defaultValue={sort}>
            <option value="">Catalogue order</option>
            <option value="recent">Recently added</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <input type="hidden" name="view" value={view} />
        <button className="button button-primary" type="submit">
          Apply filters
        </button>
      </Form>

      <div className="results-heading">
        <p aria-live="polite" key={active} className="result-count">
          {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </p>
        {active && (
          <Link className="text-link" href="/discover">
            Clear filters
          </Link>
        )}
      </div>
      <nav className="view-options" aria-label="Catalogue layout">
        {["grid", "list"].map((v) => (
          <Link
            key={v}
            aria-current={v === view ? "true" : undefined}
            href={
              "/discover?" +
              new URLSearchParams([...query.entries(), ["view", v]]).toString()
            }
          >
            {v} view
          </Link>
        ))}
      </nav>
      {resources.length > 0 ? (
        <ul
          className={
            "resource-grid catalogue-results " +
            (view === "list" ? "list-view" : "")
          }
          key={"results:" + active + view}
        >
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
