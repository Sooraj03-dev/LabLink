import { Dashboard } from "@/components/features/dashboard";
import { workspaceData } from "@/server/workspace";
export const metadata = { title: "Approvals" };
export default async function ApprovalsPage() {
  return <Dashboard {...await workspaceData(true)} />;
}
