import Link from "next/link";
import { LabBench } from "@/components/features/lab-bench";
import { departments, resourceTypes, sampleResources } from "@/lib/catalogue";

export default function HomePage() {
  return (
    <>
      <section className="frame hero" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">
            <span />
            Campus laboratory resource sharing
          </p>
          <h1 id="hero-title">
            The right kit for <em>every project.</em>
          </h1>
          <p className="intro">
            Find equipment, development kits and workstations across campus
            labs. Check the specs and see what access your project will need.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/discover">
              Explore the catalogue
            </Link>
            <a className="text-link" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>
        <LabBench />
      </section>

      <section className="catalogue-preview" aria-labelledby="preview-title">
        <div className="frame preview-layout">
          <div>
            <p className="eyebrow">Sample catalogue</p>
            <h2 id="preview-title">On the bench</h2>
            <p>
              {sampleResources.length} resources across {departments.length}{" "}
              example departments.
            </p>
          </div>
          <ul className="preview-ledger">
            {sampleResources.slice(0, 3).map((resource) => (
              <li key={resource.id}>
                <span>{resourceTypes[resource.type]}</span>
                <Link href={`/resources/${resource.id}`}>{resource.name}</Link>
                <span>{resource.specs[0]?.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="frame workflow"
        id="how-it-works"
        aria-labelledby="workflow-title"
      >
        <h2 id="workflow-title">From project to lab bench</h2>
        <dl className="workflow-ledger">
          <div>
            <dt>Find the right resource</dt>
            <dd>
              Filter the sample catalogue by department, resource type or
              approval requirements. Open an item to check its specs and lab
              location.
            </dd>
          </div>
          <div>
            <dt>Request access</dt>
            <dd>
              With campus sign-in, students will be able to send faculty a
              request that explains what the project needs and when.
            </dd>
          </div>
          <div>
            <dt>Book a time</dt>
            <dd>
              Once labs are connected, students will be able to find open slots
              and faculty will be able to review allocation options when
              requests overlap.
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
