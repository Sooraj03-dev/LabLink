import { availability, reserve } from "@/server/booking";
import { currentUser } from "@/server/session";
import { sameOrigin } from "@/server/auth-request";
import pilot from "@/lib/booking/pilot.json";

type Context = { params: Promise<{ id: string }> };
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (id !== pilot.resourceId)
    return json({ message: "No booking schedule for this resource." }, 404);
  try {
    return json(await availability(id));
  } catch {
    return json({ message: "Could not load the lab schedule." }, 503);
  }
}
export async function POST(request: Request, { params }: Context) {
  if (!sameOrigin(request))
    return json({ message: "Open booking from LabLink." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ message: "Expected a booking selection." }, 415);
  const user = await currentUser();
  if (!user)
    return json(
      {
        message: "Sign in with your campus account to reserve this instrument.",
      },
      401,
    );
  const body = await request.json().catch(() => null);
  try {
    const result = await reserve((await params).id, user.uid, body);
    return json(result, result.status);
  } catch {
    return json(
      {
        message:
          "The reservation could not be confirmed. Refresh and try again.",
      },
      503,
    );
  }
}
