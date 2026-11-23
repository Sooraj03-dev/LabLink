import { describe, expect, it } from "vitest";
import {
  campusEmailAllowed,
  roleFromClaim,
  roleSchema,
  sessionLifetimeMs,
} from "../../src/lib/auth";
import { nextRateWindow } from "../../src/lib/rate-window";

describe("campus sessions", () => {
  it("accepts only the three demo roles and defaults unknown claims to student", () => {
    expect(roleSchema.options).toEqual(["student", "faculty", "admin"]);
    expect(roleSchema.safeParse("staff").success).toBe(false);
    expect(roleFromClaim(undefined)).toBe("student");
    expect(roleFromClaim("faculty")).toBe("faculty");
  });
  it("checks a verified email against the complete campus domain", () => {
    expect(campusEmailAllowed("member@Campus.edu", true, "campus.edu")).toBe(
      true,
    );
    expect(campusEmailAllowed("member@campus.edu", false, "campus.edu")).toBe(
      false,
    );
    expect(campusEmailAllowed("member@outside.edu", true, "campus.edu")).toBe(
      false,
    );
    expect(campusEmailAllowed(undefined, undefined, undefined)).toBe(true);
  });
  it("enforces a bounded session lifetime", () => {
    expect(sessionLifetimeMs(undefined)).toBe(5 * 86400000);
    expect(() => sessionLifetimeMs("15")).toThrow();
  });
});

describe("auth rate limit", () => {
  it("admits ten requests per minute and resets at the next minute", () => {
    let window = nextRateWindow(undefined, 1000, 10);
    for (let count = 2; count <= 10; count++) {
      window = nextRateWindow(window ?? undefined, 1000, 10);
      expect(window?.count).toBe(count);
    }
    expect(nextRateWindow(window ?? undefined, 59999, 10)).toBeNull();
    expect(nextRateWindow(window ?? undefined, 60000, 10)).toEqual({
      start: 60000,
      count: 1,
    });
  });
});
