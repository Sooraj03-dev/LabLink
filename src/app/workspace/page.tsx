import { Dashboard } from "@/components/features/dashboard";
import { workspaceData } from "@/server/workspace";
export const metadata = { title: "My workspace" };
export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string }>;
}) {
  return (
    <Dashboard {...await workspaceData(false, (await searchParams).resource)} />
  );
}
