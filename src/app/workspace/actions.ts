"use server";
import { FieldValue } from "firebase-admin/firestore";
import { currentUser } from "@/server/session";
import { database } from "@/server/firebase";
import { requestInput, type RequestRow } from "@/lib/requests";
import { sampleResources } from "@/lib/catalogue";
import { z } from "zod";

export async function saveRequest(
  input: unknown,
  requestId: string,
): Promise<RequestRow> {
  const user = await currentUser();
  if (!user) throw new Error("Sign in to save your request.");
  const data = requestInput.parse(input);
  const id = z.uuid().parse(requestId);
  const resource = sampleResources.find((item) => item.id === data.resourceId);
  if (!resource) throw new Error("Resource unavailable.");
  const db = database();
  const record = db.collection("accessRequests").doc(user.uid + "_" + id);
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(record);
    if (existing.exists)
      return {
        id: record.id,
        projectTitle: existing.get("projectTitle"),
        resourceName: existing.get("resourceName"),
        hoursNeeded: existing.get("hoursNeeded"),
        status: existing.get("status"),
      };
    const lab = await tx.get(db.collection("resources").doc(resource.id));
    const reviewers = user.demo
      ? ["demo-faculty", "demo-admin"]
      : z.array(z.string().min(1)).catch([]).parse(lab.get("reviewerIds"));
    const row: RequestRow = {
      id: record.id,
      projectTitle: data.projectTitle,
      resourceName: resource.name,
      hoursNeeded: data.hoursNeeded,
      status: reviewers.length ? "submitted" : "draft",
    };
    tx.create(record, {
      ...row,
      resourceId: resource.id,
      requesterId: user.uid,
      reviewerIds: reviewers,
      createdAt: FieldValue.serverTimestamp(),
    });
    return row;
  });
}

export async function reviewRequest(
  id: string,
  outcome: "approved" | "rejected",
) {
  const user = await currentUser();
  if (!user || user.role === "student")
    throw new Error("Reviewer access required.");
  if (!id || id.includes("/") || id.length > 300)
    throw new Error("Unknown request.");
  const status = z.enum(["approved", "rejected"]).parse(outcome);
  const db = database(),
    ref = db.collection("accessRequests").doc(id);
  await db.runTransaction(async (tx) => {
    const row = await tx.get(ref);
    const reviewers = z
      .array(z.string())
      .catch([])
      .parse(row.get("reviewerIds"));
    if (!reviewers.includes(user.uid) || row.get("status") !== "submitted")
      throw new Error("Request unavailable.");
    tx.update(ref, {
      status,
      reviewedBy: user.uid,
      reviewedAt: FieldValue.serverTimestamp(),
    });
  });
}
