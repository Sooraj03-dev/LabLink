import Link from "next/link";
import { requireUser } from "@/server/session";
import { AccountControls } from "@/components/features/account-controls";

export const metadata = { title: "My workspace" };

export default async function WorkspacePage() {
  const user = await requireUser();
  return (
    <div className="frame inner-page">
      <div className="page-heading">
        <p className="eyebrow">{user.role} workspace</p>
        <h1>My workspace</h1>
        <p>Signed in as {user.displayName}.</p>
      </div>
      <div className="hero-actions">
        <Link className="button button-primary" href="/discover">
          Explore the catalogue
        </Link>
        {user.role !== "student" && (
          <Link className="button button-outline" href="/approvals">
            View approvals
          </Link>
        )}
      </div>
      <AccountControls demo={user.demo} />
    </div>
  );
}
