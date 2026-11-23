import "server-only";
import { cookies } from "next/headers";
import { roleSchema } from "@/lib/auth";

// Used only to select the browser's sample workspace. Firebase verifies campus roles separately.
export const sampleCookie = "lablink_sample_role";
export async function sampleRole() {
  return roleSchema.safeParse((await cookies()).get(sampleCookie)?.value).data;
}
