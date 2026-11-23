import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { campusEmailAllowed, roleFromClaim } from "@/lib/auth";
import { adminAuth, clientConfig, database, demoEnabled } from "./firebase";

export const cookieName = "lablink_session";

export function identity(claims: DecodedIdToken) {
  const role = roleFromClaim(claims.role);
  const demo = claims.demo === true;
  if (demo) {
    if (
      !demoEnabled() ||
      claims.uid !== "demo-" + role ||
      claims.firebase.sign_in_provider !== "custom"
    )
      return null;
  } else if (
    claims.firebase.sign_in_provider !== "google.com" ||
    !campusEmailAllowed(
      claims.email,
      claims.email_verified,
      process.env.CAMPUS_EMAIL_DOMAIN,
    )
  ) {
    return null;
  }
  return {
    uid: claims.uid,
    role,
    demo,
    displayName:
      (typeof claims.name === "string" && claims.name.trim()) ||
      (demo ? "Demo " + role : claims.email || "Campus member"),
  };
}

export async function createProfile(
  claims: DecodedIdToken,
  user: NonNullable<ReturnType<typeof identity>>,
) {
  const ref = database().collection("users").doc(user.uid);
  await database().runTransaction(async (tx) => {
    const profile = await tx.get(ref);
    if (profile.exists) {
      if (profile.get("role") !== user.role)
        tx.update(ref, { role: user.role });
      return;
    }
    tx.create(ref, {
      ...user,
      email: claims.email ?? null,
      photoURL: claims.picture ?? null,
      department: null,
      accessibility: {
        fontScale: 1,
        contrast: "default",
        reducedMotion: "system",
      },
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export const currentUser = cache(async function currentUser() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value || !clientConfig()) return null;
  try {
    return identity(await adminAuth().verifySessionCookie(value, true));
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
