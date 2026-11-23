import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { database } from "@/server/firebase";
import { AccountControls } from "@/components/features/account-controls";

export const metadata = { title: "Approvals" };
const reviewItem = z.object({
  projectTitle: z.string(),
  resourceName: z.string(),
  hoursNeeded: z.number().positive(),
  status: z.string(),
});

export default async function ApprovalsPage() {
  const user = await requireUser();
  if (user.role === "student") redirect("/workspace");
  const snapshot = await database()
    .collection("accessRequests")
    .where("reviewerIds", "array-contains", user.uid)
    .where("status", "==", "submitted")
    .get();
  return (
    <div className="frame inner-page">
      <Link className="text-link" href="/workspace">
        My workspace
      </Link>
      <div className="page-heading">
        <h1>Approvals</h1>
        <p>Pending requests assigned to you for review.</p>
      </div>
      {snapshot.empty ? (
        <p>No requests are waiting for your review.</p>
      ) : (
        <ul className="resource-grid">
          {snapshot.docs.map((doc) => {
            const item = reviewItem.parse(doc.data());
            return (
              <li key={doc.id} className="bench-panel resource-card">
                <h2>{item.projectTitle}</h2>
                <p>
                  {item.resourceName} · {item.hoursNeeded} hours requested
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <AccountControls demo={user.demo} />
    </div>
  );
}
