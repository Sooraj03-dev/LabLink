import Image from "next/image";
import Link from "next/link";
import { approvalLabels, resourceTypes, type Resource } from "@/lib/catalogue";
import { inventory } from "@/lib/inventory";
import { SpecimenTag } from "@/components/ui/specimen-tag";
import { AvailabilityStrip } from "@/components/ui/availability-strip";

/** Hardware-type CSS class for living SVG card animations. */
function cardAnimClass(id: string, type: string): string {
  if (id.includes("oscilloscope") || id.includes("logic-analyser"))
    return "card-scope";
  if (id.includes("esp32") || id.includes("fpga") || type === "devKit")
    return "card-devkit";
  return "card-instrument";
}

export function ResourceCard({
  resource,
  heading: Heading = "h2",
  compareSlot,
}: {
  resource: Resource;
  heading?: "h2" | "h3";
  compareSlot?: React.ReactNode;
}) {
  const href = "/resources/" + resource.id,
    stock = inventory(resource.id);
  const animClass = cardAnimClass(resource.id, resource.type);

  return (
    <article className={"equipment-card " + animClass}>
      <div className="instrument-image">
        <Image
          src={"/instruments/" + resource.id + ".svg"}
          alt=""
          width={480}
          height={240}
          unoptimized
        />
        <span className="category-label">{resourceTypes[resource.type]}</span>
        {compareSlot && <div className="card-compare-slot">{compareSlot}</div>}
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
        {/* Compact monospace spec readout */}
        <div className="card-specs">
          {resource.specs.slice(0, 3).map((spec) => (
            <span key={spec.label} className="card-spec">
              {spec.value}
            </span>
          ))}
        </div>
        <p>{resource.description}</p>
        {/* 7-day availability strip */}
        <AvailabilityStrip resourceId={resource.id} totalFree={stock.free} />
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
