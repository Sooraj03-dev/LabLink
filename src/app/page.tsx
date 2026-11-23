import Link from "next/link";
import { LabBench } from "@/components/features/lab-bench";
import { ResourceCard } from "@/components/features/resource-card";
import { sampleResources } from "@/lib/catalogue";
import { categories, inventory, recentResources } from "@/lib/inventory";
import { sampleRequests } from "@/lib/requests";
import { StatsReadout } from "@/components/features/stats-readout";
import { CategoryIcon } from "@/components/ui/category-icon";

const steps = [
  [
    "Browse equipment",
    "Find the right instrument",
    "Compare specs, availability and lab locations before choosing equipment for your project.",
    "/discover",
    "Explore the catalogue",
  ],
  [
    "Request lab resources",
    "Make the case for lab time",
    "Choose equipment, name your project and tell the reviewer how many hours you need.",
    "/workspace",
    "Open my workspace",
  ],
  [
    "Use equipment for your project",
    "Follow your request",
    "Track the decision in your workspace. Once approved, coordinate your visit with the lab.",
    "/login",
    "Try a sample workspace",
  ],
];
export default function HomePage() {
  const labs = new Set(sampleResources.map((r) => r.lab)).size;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="frame hero-layout">
          <div className="hero-copy">
            <h1 id="hero-title" aria-label="The right kit for every project.">
              {["The right kit", "for every", "project."].map((line, i) => (
                <span className="line-box" key={line}>
                  <span style={{ animationDelay: 180 + i * 90 + "ms" }}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p className="intro">
              Find equipment, development kits and workstations across campus.
              Bring your next project to the lab bench.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/discover">
                Explore the catalogue
              </Link>
              <Link className="text-link" href="/login#demo-heading">
                Try a demo
              </Link>
            </div>
          </div>
          <LabBench />
        </div>
      </section>
      <section className="home-stats">
        <div className="frame">
          <h2 className="section-label">Sample campus inventory</h2>
          <dl className="stat-strip">
            <StatsReadout
              label="Available units"
              value={sampleResources.reduce(
                (n, r) => n + inventory(r.id).free,
                0,
              )}
            />
            <StatsReadout label="Registered labs" value={labs} />
            <StatsReadout label="Active demo students" value={1} />
            <StatsReadout
              label="Sample projects"
              value={new Set(sampleRequests.map((r) => r.projectTitle)).size}
            />
          </dl>
        </div>
      </section>
      <section className="frame home-section">
        <div className="section-head">
          <div>
            <p className="section-label">Featured equipment</p>
            <h2>On the bench</h2>
          </div>
          <Link className="text-link" href="/discover">
            View catalogue
          </Link>
        </div>
        <ul className="featured-grid">
          {sampleResources.slice(0, 3).map((resource) => (
            <li key={resource.id}>
              <ResourceCard resource={resource} heading="h3" />
            </li>
          ))}
        </ul>
      </section>
      <section className="category-section">
        <div className="frame home-section">
          <h2>Browse by field</h2>
          <ul className="category-list">
            {categories.map((name, i) => (
              <li key={name}>
                <Link href={"/discover?category=" + encodeURIComponent(name)}>
                  <CategoryIcon index={i} />
                  <span>{name}</span>
                  <small>
                    {
                      sampleResources.filter((r) =>
                        inventory(r.id).categories.includes(name),
                      ).length
                    }{" "}
                    resources
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="frame home-section notebook" id="how-it-works">
        <div className="notebook-title">
          <p className="section-label">How it works</p>
          <h2>
            From project
            <br />
            to lab bench.
          </h2>
        </div>
        <div className="notebook-pages">
          {steps.map(([label, title, copy, url, action], i) => (
            <article
              className="notebook-page"
              key={title}
              style={{ top: 7 + i * 1.6 + "rem" }}
            >
              <p className="notebook-tab">
                Step {i + 1} / {label}
              </p>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link className="text-link" href={url || "/discover"}>
                {action}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="frame home-section">
        <div className="section-head">
          <h2>Recently added</h2>
          <Link className="text-link" href="/discover?sort=recent">
            View newest first
          </Link>
        </div>
        <ul className="recent-ledger">
          {recentResources()
            .slice(0, 3)
            .map((r) => (
              <li key={r.id}>
                <Link href={"/resources/" + r.id}>{r.name}</Link>
                <span>{r.lab}</span>
                <time dateTime={inventory(r.id).added}>
                  {inventory(r.id).added}
                </time>
              </li>
            ))}
        </ul>
      </section>
      <section id="about" className="about-band">
        <div className="frame section-head">
          <div>
            <p className="section-label">About LabLink</p>
            <h2>Put campus equipment to work.</h2>
            <p>
              LabLink connects student projects to shared laboratories across
              departments.
            </p>
          </div>
          <Link className="button button-primary" href="/discover">
            Find equipment
          </Link>
        </div>
      </section>
    </>
  );
}
