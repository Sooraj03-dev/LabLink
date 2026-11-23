import { expect, test } from "@playwright/test";
test("equipment notebook supports search, plans and available alternatives", async ({
  page,
}) => {
  await page.goto("/discover");
  await page.getByRole("link", { name: /Equipment assistant/ }).click();
  await page.getByRole("textbox").fill("Wireless BLE sensor board");
  await page.getByRole("button", { name: "Find matches" }).click();
  await expect(page.getByRole("status")).toContainText("Offline preview");
  const results = page.getByRole("region", { name: "Matching equipment" });
  await expect(
    results.getByRole("link", { name: "ESP32 prototyping kit" }),
  ).toBeVisible();
  await page.getByLabel("What would you like to do?").selectOption("plan");
  await page.getByLabel("Project deadline").fill("2027-03-17");
  await page.getByRole("button", { name: "Build resource plan" }).click();
  await expect(
    page.getByRole("region", { name: "Resource plan" }),
  ).toContainText("Estimated lab time");
  await page.goto("/resources/gpu-workstation");
  await page
    .getByRole("link", { name: "Compare available alternatives" })
    .click();
  await expect(page.getByLabel("Reference equipment")).toHaveValue(
    "gpu-workstation",
  );
  await page.getByRole("button", { name: "Find alternatives" }).click();
  await expect(
    page.getByRole("link", { name: "CAD workstation" }),
  ).toBeVisible();
});
