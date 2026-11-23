import { createHash } from "node:crypto";
import {
  assistantInput,
  candidatesFor,
  catalogueSelection,
  groundSelection,
  type AssistantResult,
} from "@/lib/assistant";
import { sameOrigin, withinLimit } from "@/server/auth-request";
import { currentUser } from "@/server/session";
import { geminiProvider, previewProvider } from "@/server/ai/provider";
import { reserveDailyCall } from "@/server/ai/usage";

const cache = new Map<string, { expires: number; result: AssistantResult }>();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ message: "Open the assistant from LabLink." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ message: "Expected a JSON request." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return json({ message: "Enter an equipment request." }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (let part = await reader.read(); !part.done; part = await reader.read()) {
    size += part.value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      return json({ message: "Shorten your description." }, 413);
    }
    chunks.push(part.value);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return json({ message: "Invalid request." }, 400);
  }
  const parsed = assistantInput.safeParse(body);
  if (!parsed.success)
    return json(
      { message: "Check your description, deadline and selected equipment." },
      400,
    );
  const input = parsed.data,
    candidates = candidatesFor(input);
  const fallback = (notice: string) =>
    json({
      source: "catalogue",
      notice,
      matches: groundSelection(
        input,
        catalogueSelection(input, candidates),
        candidates,
      ).map((item) => ({ ...item, hours: null })),
    } satisfies AssistantResult);
  if (process.env.AI_ENABLED !== "true")
    return fallback("AI is switched off. Showing catalogue matches.");
  if (!candidates.length)
    return fallback(
      "There are no available items of this type in another department.",
    );
  if (process.env.GENAI_PROVIDER === "mock") {
    return json({
      source: "preview",
      notice: "Offline preview using catalogue keywords.",
      matches: groundSelection(
        input,
        await previewProvider.select(input, candidates),
        candidates,
      ),
    } satisfies AssistantResult);
  }
  if (process.env.GENAI_PROVIDER !== "gemini" || !process.env.GEMINI_API_KEY)
    return fallback("Gemini is unavailable. Showing catalogue matches.");
  const key = createHash("sha256")
    .update(JSON.stringify([process.env.GENAI_MODEL, input]))
    .digest("hex");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return json(hit.result);
  try {
    if (!(await withinLimit(request, "assistant", 12)))
      return fallback("The assistant is busy. Showing catalogue matches.");
    const user = await currentUser();
    if (!(await reserveDailyCall(user?.uid)))
      return fallback(
        "The daily AI allowance has been reached. Showing catalogue matches.",
      );
    const result: AssistantResult = {
      source: "gemini",
      notice: "Selected by Gemini from the sample catalogue.",
      matches: groundSelection(
        input,
        await geminiProvider.select(input, candidates),
        candidates,
      ),
    };
    if (cache.size >= 256) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { expires: Date.now() + 600000, result });
    return json(result);
  } catch {
    return fallback(
      "Gemini could not complete this request. Showing catalogue matches.",
    );
  }
}
