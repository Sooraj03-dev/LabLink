import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "./session";
import { sampleRole } from "./sample-session";
import { database } from "./firebase";
import { requestRow, sampleRequests } from "@/lib/requests";
import { sampleResources } from "@/lib/catalogue";

export async function workspaceData(review: boolean, requested?: string) {
  const resourceId = sampleResources.find((r) => r.id === requested)?.id;
  const user = await currentUser();
  if (!user) {
    const role = await sampleRole();
    if (!role)
      redirect("/login" + (resourceId ? "?resource=" + resourceId : ""));
    if (review && role === "student") redirect("/workspace");
    return {
      name: "Demo " + role,
      role,
      sample: true,
      emulator: false,
      initial: sampleRequests,
      resourceId,
      review,
    };
  }
  if (review && user.role === "student") redirect("/workspace");
  const records = database().collection("accessRequests");
  const query = review
    ? records.where("reviewerIds", "array-contains", user.uid)
    : records.where("requesterId", "==", user.uid);
  const docs = await query.get();
  const initial = docs.docs.flatMap((doc) => {
    const parsed = requestRow.safeParse({ ...doc.data(), id: doc.id });
    return parsed.success ? [parsed.data] : [];
  });
  return {
    name: user.displayName,
    role: user.role,
    sample: false,
    emulator: user.demo,
    initial,
    resourceId,
    review,
  };
}
