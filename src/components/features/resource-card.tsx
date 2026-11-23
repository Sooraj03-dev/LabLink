import Link from "next/link";
import { approvalLabels, resourceTypes, type Resource } from "@/lib/catalogue";
import { BenchPanel } from "@/components/ui/bench-panel";
import { Readout } from "@/components/ui/readout";
import { SpecimenTag } from "@/components/ui/specimen-tag";

export function ResourceCard({
  resource,
  heading: Heading = "h2",
}: {
  resource: Resource;
  heading?: "h2" | "h3";
}) {
  return (
    <BenchPanel>
      <article className="resource-card">
        <div className="resource-meta">
          <span>{resourceTypes[resource.type]}</span>
          <SpecimenTag>{approvalLabels[resource.approval]}</SpecimenTag>
        </div>
        <Heading>
          <Link href={`/resources/${resource.id}`}>{resource.name}</Link>
        </Heading>
        <p className="resource-location">
          {resource.lab} · {resource.department}
        </p>
        <dl className="resource-specs">
          {resource.specs.slice(0, 2).map(({ label, value }) => (
            <Readout key={label} label={label} value={value} />
          ))}
        </dl>
      </article>
    </BenchPanel>
  );
}
