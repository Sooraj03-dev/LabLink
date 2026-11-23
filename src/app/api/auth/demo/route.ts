import { z } from "zod";
import { roleSchema } from "@/lib/auth";
import { authError, sameOrigin, withinLimit } from "@/server/auth-request";
import { adminAuth, demoEnabled } from "@/server/firebase";

export async function POST(request: Request) {
  if (!demoEnabled()) return authError(404, "Demo login is unavailable.");
  if (!sameOrigin(request))
    return authError(403, "Open the sign-in page and try again.");
  const input = z
    .strictObject({ role: roleSchema })
    .safeParse(await request.json().catch(() => null));
  if (!input.success) return authError(400, "Choose a demo role.");
  try {
    if (!(await withinLimit(request, "demo", 10)))
      return authError(429, "Please wait a minute before signing in again.");
    const { role } = input.data;
    const token = await adminAuth().createCustomToken("demo-" + role, {
      role,
      demo: true,
    });
    return Response.json(
      { token },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return authError(503, "Demo sign-in is temporarily unavailable.");
  }
}
