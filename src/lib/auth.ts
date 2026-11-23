import { z } from "zod";

export const roleSchema = z.enum(["student", "faculty", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export interface AuthClientConfig {
  projectId: string;
  apiKey: string;
  appId: string;
  authDomain: string;
  emulator: boolean;
}

export function roleFromClaim(value: unknown): Role {
  return roleSchema.safeParse(value).data ?? "student";
}

export function campusEmailAllowed(
  email: string | undefined,
  verified: boolean | undefined,
  domain: string | undefined,
) {
  const requiredDomain = domain?.trim().toLowerCase();
  if (!requiredDomain) return true;
  return Boolean(
    verified &&
    email?.split("@").length === 2 &&
    email.toLowerCase().endsWith("@" + requiredDomain),
  );
}

export function sessionLifetimeMs(value: string | undefined) {
  const days = Number(value || 5);
  if (!Number.isInteger(days) || days < 1 || days > 14)
    throw new Error("SESSION_COOKIE_DAYS must be 1–14.");
  return days * 86400000;
}
