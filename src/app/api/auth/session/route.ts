import { NextResponse } from "next/server";
import { z } from "zod";
import type { DecodedIdToken } from "firebase-admin/auth";
import { sessionLifetimeMs } from "@/lib/auth";
import { authError, sameOrigin, withinLimit } from "@/server/auth-request";
import { adminAuth, clientConfig, emulatorMode } from "@/server/firebase";
import { cookieName, createProfile, identity } from "@/server/session";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return authError(403, "Open the sign-in page and try again.");
  if (!clientConfig()) return authError(503, "Campus sign-in is unavailable.");
  const input = z
    .strictObject({ idToken: z.string().min(1).max(16384) })
    .safeParse(await request.json().catch(() => null));
  if (!input.success) return authError(400, "A sign-in token is required.");
  try {
    if (!(await withinLimit(request, "session", 30)))
      return authError(429, "Please wait a minute before signing in again.");
    const auth = adminAuth();
    let claims: DecodedIdToken;
    try {
      claims = await auth.verifyIdToken(input.data.idToken, true);
    } catch {
      return authError(401, "Your sign-in has expired. Please sign in again.");
    }
    if (Date.now() / 1000 - claims.auth_time > 300)
      return authError(401, "Please sign in again to start a session.");
    const user = identity(claims);
    if (!user)
      return authError(
        403,
        "This account does not have access to this campus.",
      );
    await createProfile(claims, user);
    const expiresIn = sessionLifetimeMs(process.env.SESSION_COOKIE_DAYS);
    const value = await auth.createSessionCookie(input.data.idToken, {
      expiresIn,
    });
    const response = NextResponse.json(
      { destination: user.role === "faculty" ? "/approvals" : "/workspace" },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(cookieName, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: !emulatorMode(),
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return response;
  } catch {
    return authError(503, "Campus sign-in is temporarily unavailable.");
  }
}
