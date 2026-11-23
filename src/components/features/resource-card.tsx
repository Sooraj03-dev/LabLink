import Image from "next/image";
import Link from "next/link";
import { approvalLabels, resourceTypes, type Resource } from "@/lib/catalogue";
import { inventory } from "@/lib/inventory";
import { SpecimenTag } from "@/components/ui/specimen-tag";
export function ResourceCard({
  resource,
  heading: Heading = "h2",
}: {
  resource: Resource;
  heading?: "h2" | "h3";
}) {
  const href = "/resources/" + resource.id,
    stock = inventory(resource.id);
  return (
    <article className="equipment-card">
      <div className="instrument-image">
        <Image
          src={"/instruments/" + resource.id + ".svg"}
          alt=""
          width={480}
          height={240}
          unoptimized
        />
        <span className="category-label">{resourceTypes[resource.type]}</span>
      </div>
      <div className="equipment-body">
        <div className="stock-label">
          <span data-free={stock.free > 0} />
          {stock.free ? stock.free + " available" : "In use"} · sample
        </div>
        <Heading>
          <Link href={href}>{resource.name}</Link>
        </Heading>
        <p className="resource-location">
          {resource.lab} · {resource.location}
        </p>
        <p>{resource.description}</p>
        <div className="equipment-foot">
          <SpecimenTag>{approvalLabels[resource.approval]}</SpecimenTag>
          <Link
            className="text-link"
            href={href}
            aria-label={"View details for " + resource.name}
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
