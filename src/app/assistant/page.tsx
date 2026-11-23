import Link from "next/link";
import { AssistantNotebook } from "@/components/features/assistant-notebook";
import { assistantMode } from "@/lib/assistant";
import { sampleResources } from "@/lib/catalogue";
export const metadata = { title: "Equipment assistant" };
export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; resource?: string }>;
}) {
  const params = await searchParams;
  const resource = sampleResources.find((item) => item.id === params.resource);
  const mode = assistantMode.safeParse(params.mode).data ?? "search";
  return (
    <div className="frame inner-page">
      <Link className="text-link" href="/discover">
        Back to catalogue
      </Link>
      <div className="page-heading">
        <p className="section-label">Lab notebook</p>
        <h1>Equipment assistant</h1>
        <p className="intro">
          Find an instrument, plan lab time, or compare equipment across
          departments.
        </p>
      </div>
      <AssistantNotebook
        initialMode={mode}
        initialResource={resource?.id}
        resources={sampleResources.map(({ id, name, specs }) => ({
          id,
          name,
          specs,
        }))}
      />
    </div>
  );
}
