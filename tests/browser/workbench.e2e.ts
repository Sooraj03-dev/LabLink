import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("three direct logins keep sample activity in the same browser", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  const header = page.getByRole("banner");
  const account = header.getByRole("group", { name: "Signed-in account" });
  const signOut = account.getByRole("button", { name: "Sign out" });
  for (const role of ["Student", "Faculty", "Admin"]) {
    await expect(
      page.getByRole("button", { name: role, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Student", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(account).toContainText("Demo student");
  await expect(
    header.getByRole("link", { name: "Log in / Sign up" }),
  ).toHaveCount(0);
  await page.goto("/approvals");
  await expect(page).toHaveURL(/\/workspace$/);
  await page.goto("/resources/mixed-signal-oscilloscope");
  const nextFree = page.getByText(/^Next free half hour/);
  await expect(nextFree).toBeVisible();
  const beforeBooking = await nextFree.innerText();
  await page.getByRole("button", { name: "Detail", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Detail", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Enlarge drawing" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Request access", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Request equipment" });
  await expect(
    form.getByRole("combobox", { name: "Equipment", exact: true }),
  ).toHaveValue("mixed-signal-oscilloscope");
  await form.getByLabel("Project title").fill("Sensor calibration run");
  await form.getByRole("button", { name: "Save request" }).click();
  await expect(page.getByRole("status")).toContainText("Request sent");
  await signOut.click();
  await expect(
    header.getByRole("link", { name: "Log in / Sign up" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Faculty", exact: true }).click();
  await expect(page).toHaveURL(/\/approvals$/);
  await expect(account).toContainText("Demo faculty");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Sensor calibration run" })
    .getByRole("button", { name: "Approve", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Request approved");
  await signOut.click();
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByText("Welcome, Demo admin.")).toBeVisible();
  await expect(account).toContainText("Demo admin");
  await expect(
    page.getByRole("link", { name: "View approvals" }),
  ).toBeVisible();
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "lablink_session",
    ),
  ).toBe(false);
  await signOut.click();
  await page.getByRole("button", { name: "Student", exact: true }).click();
  await page.getByLabel("Show").selectOption("approved");
  await expect(page.locator(".request-list li")).toContainText(
    "Sensor calibration run",
  );
  const rowToggle = page.getByRole("button", {
    name: /Sensor calibration run/,
  });
  await rowToggle.press("Enter");
  await expect(rowToggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "View instrument" }),
  ).toBeVisible();
  await rowToggle.press("Space");
  await expect(rowToggle).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Book lab time" }).click();
  const reservation = page.getByRole("dialog", { name: "Reserve lab time" });
  await expect(
    reservation.getByRole("button", { name: "Confirm reservation" }),
  ).toBeDisabled();
  await reservation
    .getByLabel("Start time (India Standard Time)")
    .selectOption({ index: 1 });
  await reservation
    .getByRole("button", { name: "Confirm reservation" })
    .click();
  await expect(page.getByRole("status")).toContainText("Lab session reserved");
  await page.reload();
  await expect(page.getByLabel("Reserved lab sessions")).toContainText(
    "scope-01",
  );
  await expect(
    page.getByRole("heading", { name: "Recently viewed" }).locator(".."),
  ).toContainText("Mixed-signal oscilloscope");
  await page.goto("/resources/mixed-signal-oscilloscope");
  await expect(nextFree).toBeVisible();
  await expect(nextFree).not.toHaveText(beforeBooking);
  const afterBooking = await nextFree.innerText();
  await page.goto("/assistant");
  await page.getByRole("textbox").fill("Mixed-signal oscilloscope");
  await page.getByRole("button", { name: "Find matches" }).click();
  await expect(page.getByText(/^Next free half hour/)).toContainText(
    afterBooking,
  );
});

test("catalogue search, filters and layout survive navigation", async ({
  page,
}) => {
  await page.goto("/discover");
  const compare = page.getByRole("region", { name: "Compare bench" });
  const buttons = page.getByRole("button", { name: /^Compare / });
  for (const index of [0, 1, 2]) await buttons.nth(index).click();
  await page
    .getByRole("button", { name: "Compare FDM 3D printer", exact: true })
    .click();
  await expect(compare.getByRole("status")).toHaveText(
    "Compare up to 3 resources.",
  );
  await compare.getByRole("button", { name: "Compare specs" }).click();
  const comparison = page.getByRole("dialog", {
    name: "Specification comparison",
  });
  await expect(comparison.getByRole("columnheader")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await expect(comparison).toBeHidden();
  await expect(
    compare.getByRole("button", { name: "Compare specs" }),
  ).toBeFocused();
  await compare.getByRole("button", { name: "Clear", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill("ESP32");
  await page
    .getByRole("combobox", { name: "Field", exact: true })
    .selectOption("Electronics");
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("recent");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator(".equipment-card:visible")).toHaveCount(1);
  await page.getByRole("link", { name: "list view" }).click();
  await expect(page.locator(".list-view")).toContainText("ESP32");
  await page
    .getByRole("combobox", { name: "Availability", exact: true })
    .selectOption("busy");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("heading", { name: "No matching resources" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page.locator(".equipment-card:visible")).toHaveCount(8);
});

for (const colorScheme of ["dark", "light"] as const) {
  test(
    "reduced motion, keyboard dials and accessibility in " + colorScheme,
    async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/");
      const trace = page.locator(".scope-trace");
      const before = await trace.evaluate(
        (el) => getComputedStyle(el).transform,
      );
      await page.waitForTimeout(510);
      expect(await trace.evaluate((el) => getComputedStyle(el).transform)).toBe(
        before,
      );
      const dial = page.getByRole("slider", { name: "Time per division" });
      const initial = Number(await dial.getAttribute("aria-valuenow"));
      await dial.focus();
      await dial.press("ArrowRight");
      expect(Number(await dial.getAttribute("aria-valuenow"))).toBeGreaterThan(
        initial,
      );
      const audit = await new AxeBuilder({ page }).analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    },
  );
}

test("mobile menu opens and lands on the three demo roles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Log in / Sign up" })
    .click();
  await expect(
    page.getByRole("button", { name: "Admin", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Student", exact: true }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByRole("banner").getByRole("link", { name: "LabLink" }).click();
  await expect(page).toHaveURL(/\/$/);
  const account = page
    .getByRole("banner")
    .getByRole("group", { name: "Signed-in account" });
  await expect(account).toContainText("Demo student");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(
    account.getByRole("button", { name: "Sign out" }),
  ).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await account.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(account).toHaveCount(0);
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login$/);
});
