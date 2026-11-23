import { NextSession } from "@/components/features/booking-panel";
import pilot from "@/lib/booking/pilot.json";
import type { Metadata } from "next";
import Link from "next/link";
import { ResourceGallery } from "@/components/features/resource-gallery";
import { TrackView } from "@/components/features/recent-views";
import { inventory } from "@/lib/inventory";
import { notFound } from "next/navigation";
import { ResourceCard } from "@/components/features/resource-card";
import { BenchPanel } from "@/components/ui/bench-panel";
import { SpecimenTag } from "@/components/ui/specimen-tag";
import {
  approvalLabels,
  resourceTypes,
  sampleResources,
} from "@/lib/catalogue";

type ResourcePageProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return sampleResources.map(({ id }) => ({ id }));
}

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { id } = await params;
  const resource = sampleResources.find((item) => item.id === id);
  return resource
    ? { title: resource.name, description: resource.description }
    : {};
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params;
  const resource = sampleResources.find((item) => item.id === id);
  if (!resource) notFound();

  const related = sampleResources.filter(
    (item) => item.id !== id && item.type === resource.type,
  );

  return (
    <div className="frame inner-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link className="text-link" href="/discover">
          Resource catalogue
        </Link>
      </nav>
      <div className="page-heading">
        <p className="eyebrow">
          Sample resource · {resourceTypes[resource.type]}
        </p>
        <h1>{resource.name}</h1>
        <p className="intro">{resource.description}</p>
      </div>

      <TrackView id={id} />
      <ResourceGallery id={id} name={resource.name} />
      <div className="detail-grid">
        <BenchPanel>
          <table className="spec-table">
            <caption>Technical specifications</caption>
            <tbody>
              {resource.specs.map(({ label, value }) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BenchPanel>
        <BenchPanel>
          <section className="lab-location" aria-labelledby="location-heading">
            <h2 id="location-heading">Lab and access</h2>
            <p>
              <strong>{resource.lab}</strong>
              <br />
              {resource.department}
              <br />
              {resource.location}
            </p>
            <SpecimenTag>{approvalLabels[resource.approval]}</SpecimenTag>
            <p className="muted">
              {inventory(id).free} units available in the sample inventory.
            </p>
            <Link
              className="button button-primary"
              href={"/workspace?resource=" + id}
            >
              Request access
            </Link>
            {inventory(id).free === 0 && (
              <Link
                className="text-link"
                href={"/assistant?mode=compare&resource=" + id}
              >
                Compare available alternatives
              </Link>
            )}
          </section>
        </BenchPanel>
      </div>

      {id === pilot.resourceId && <NextSession />}
      {related.length > 0 && (
        <section className="related" aria-labelledby="related-heading">
          <h2 id="related-heading">More in this category</h2>
          <ul className="resource-grid">
            {related.map((item) => (
              <li key={item.id}>
                <ResourceCard resource={item} heading="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
