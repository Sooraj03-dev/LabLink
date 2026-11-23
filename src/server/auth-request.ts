import "server-only";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { Timestamp } from "firebase-admin/firestore";
import { nextRateWindow } from "@/lib/rate-window";
import { database } from "./firebase";

export function appOrigin(request: Request) {
  if (process.env.LABLINK_APP_ORIGIN) return process.env.LABLINK_APP_ORIGIN;
  const url = new URL(request.url);
  // Next.js can normalize a loopback address to localhost in request.url.
  return url.protocol + "//" + (request.headers.get("host") || url.host);
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === appOrigin(request);
}

export function authError(status: number, message: string) {
  return Response.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function withinLimit(
  request: Request,
  action: string,
  limit: number,
) {
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const address = header ? request.headers.get(header)?.trim() : "";
  const key = createHash("sha256")
    .update(action + "/" + (address && isIP(address) ? address : "shared"))
    .digest("hex");
  const ref = database().collection("authRateLimits").doc(key);
  return database().runTransaction(async (tx) => {
    const previous = await tx.get(ref);
    const next = nextRateWindow(
      previous.exists
        ? { start: previous.get("start"), count: previous.get("count") }
        : undefined,
      Date.now(),
      limit,
    );
    if (!next) return false;
    tx.set(ref, {
      ...next,
      expiresAt: Timestamp.fromMillis(next.start + 120000),
    });
    return true;
  });
}
