import { NextRequest, NextResponse } from "next/server";
import { appOrigin, authError, sameOrigin } from "@/server/auth-request";
import { adminAuth } from "@/server/firebase";
import { cookieName } from "@/server/session";
import { sampleCookie } from "@/server/sample-session";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return authError(403, "Open your workspace and try again.");
  const value = request.cookies.get(cookieName)?.value;
  let response = NextResponse.redirect(
    new URL("/login", appOrigin(request)),
    303,
  );
  try {
    if (value) {
      const claims = await adminAuth().verifySessionCookie(value, true);
      await adminAuth().revokeRefreshTokens(claims.uid);
    }
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : "";
    if (
      ![
        "auth/session-cookie-expired",
        "auth/session-cookie-revoked",
        "auth/argument-error",
        "auth/user-not-found",
        "auth/user-disabled",
      ].includes(String(code))
    ) {
      response = NextResponse.json(
        {
          message:
            "Signed out on this device. Other sessions could not be revoked.",
        },
        { status: 503 },
      );
    }
  }
  response.cookies.delete(cookieName);
  response.cookies.delete(sampleCookie);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
