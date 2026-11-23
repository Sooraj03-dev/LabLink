import "server-only";
import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { database } from "@/server/firebase";

export async function reserveDailyCall(uid?: string) {
  const db = database();
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const identity = createHash("sha256")
    .update(uid ?? "public-demo")
    .digest("hex");
  const counts = db.collection("aiUsage");
  const global = counts.doc(day);
  const personal = counts.doc(day + "-" + identity);
  return db.runTransaction(async (tx) => {
    const [total, user] = await Promise.all([tx.get(global), tx.get(personal)]);
    const used = Number(total.get("count") ?? 0),
      userUsed = Number(user.get("count") ?? 0);
    if (used >= 100 || userUsed >= 20) return false;
    const expiresAt = Timestamp.fromMillis(now + 2 * 86400000);
    tx.set(global, { count: used + 1, expiresAt });
    tx.set(personal, { count: userUsed + 1, expiresAt });
    return true;
  });
}
