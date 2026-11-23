import { expect, it } from "vitest";
import { resolveReview } from "../../src/lib/requests";

it.each(["approved", "rejected"] as const)(
  "preserves the first %s decision on retries and conflicting reviews",
  (first) => {
    const saved = resolveReview("submitted", first);
    expect(saved).toBe(first);
    expect(resolveReview(saved, "approved")).toBe(first);
    expect(resolveReview(saved, "rejected")).toBe(first);
  },
);

it("requires a submitted request before the first review", () => {
  expect(() => resolveReview("draft", "approved")).toThrow();
  expect(() => resolveReview(undefined, "rejected")).toThrow();
});
