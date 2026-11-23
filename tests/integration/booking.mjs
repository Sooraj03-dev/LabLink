import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { demoEnvironment, seedDemo } from "../../scripts/seed-demo.mjs";

const origin = "http://127.0.0.1:3196";
const require = createRequire(import.meta.url);
const resourceId = "mixed-signal-oscilloscope";
const endpoint = origin + "/api/booking/" + resourceId;
const run = randomUUID();
await seedDemo();
const app = initializeApp({ projectId: "demo-lablink" }, "booking-integration");
const db = getFirestore(app),
  auth = getAuth(app);
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3196",
  ],
  {
    windowsHide: true,
    stdio: "inherit",
    env: { ...process.env, ...demoEnvironment, LABLINK_APP_ORIGIN: "" },
  },
);
const createdUsers = [],
  requests = [];
let browser;

async function student(name) {
  const ctx = await browser.newContext(),
    page = await ctx.newPage();
  const profile = {
    sub: name + "-" + run,
    email: name + "-" + run + "@campus.example",
    email_verified: true,
    name,
  };
  const signIn = await ctx.request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-api-key",
    {
      data: {
        postBody: new URLSearchParams({
          providerId: "google.com",
          id_token: JSON.stringify(profile),
        }).toString(),
        requestUri: origin,
        returnSecureToken: true,
      },
    },
  );
  assert.equal(signIn.status(), 200);
  const { idToken, localId } = await signIn.json();
  createdUsers.push(localId);
  const session = await ctx.request.post(origin + "/api/auth/session", {
    headers: { origin },
    data: { idToken },
  });
  assert.equal(session.status(), 200);
  const title = "Booking " + name + " " + run;
  await page.goto(origin + "/workspace?resource=" + resourceId);
  const form = page.getByRole("dialog", { name: "Request equipment" });
  await form.getByLabel("Project title").fill(title);
  await form.getByLabel("Hours needed").fill("2");
  await form.getByRole("button", { name: "Save request" }).click();
  await expect(page.getByRole("status")).toContainText("Request sent");
  const records = await db
    .collection("accessRequests")
    .where("requesterId", "==", localId)
    .get();
  assert.equal(records.size, 1);
  requests.push(records.docs[0].id);
  return { ctx, page, title, requestId: records.docs[0].id };
}
async function attempt(person, selection, id = person.requestId) {
  return person.ctx.request.post(endpoint, {
    headers: { origin },
    data: { requestId: id, ...selection },
  });
}
try {
  let ready = false;
  for (let i = 0; i < 80 && server.exitCode === null; i++) {
    if ((await fetch(origin + "/login").catch(() => null))?.ok) {
      ready = true;
      break;
    }
    await delay(250);
  }
  assert(ready && server.exitCode === null);
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  });
  const a = await student("first"),
    b = await student("second");
  const board = await (await a.ctx.request.get(endpoint)).json();
  assert.equal(board.source, "emulator");
  assert.equal(board.schedule.model, "RIGOL MSO5204");
  assert.equal(
    (
      await attempt(a, {
        unit: "scope-01",
        start: Date.now() + 3600000,
        blocks: 2,
      })
    ).status(),
    403,
  );
  const faculty = await browser.newPage();
  let twoHourStart;
  await faculty.goto(origin + "/login");
  await faculty.getByRole("button", { name: "Faculty", exact: true }).click();
  for (const person of [a, b]) {
    await faculty
      .getByRole("listitem")
      .filter({ hasText: person.title })
      .getByRole("button", { name: "Approve", exact: true })
      .click();
    await expect(
      faculty.getByRole("listitem").filter({ hasText: person.title }),
    ).toHaveCount(0);
    await person.page.goto(origin + "/workspace");
    await person.page.getByRole("button", { name: "Book lab time" }).click();
    if (person === a) {
      await person.page.getByLabel("Session length").selectOption("4");
      twoHourStart = Number(
        (
          await person.page
            .getByLabel("Start time (India Standard Time)")
            .selectOption({ index: 1 })
        )[0],
      );
    }
    await person.page.getByLabel("Session length").selectOption("2");
    await person.page
      .getByLabel("Start time (India Standard Time)")
      .selectOption({ index: 1 });
  }
  const start = Number(
    await a.page.getByLabel("Start time (India Standard Time)").inputValue(),
  );
  const choice = { start, unit: "scope-01", blocks: 2 };
  assert.equal(
    Number(
      await b.page.getByLabel("Start time (India Standard Time)").inputValue(),
    ),
    start,
  );
  assert.equal((await attempt(b, choice, a.requestId)).status(), 403);
  const result = await Promise.all([attempt(a, choice), attempt(b, choice)]);
  assert.deepEqual(result.map((r) => r.status()).sort(), [200, 409]);
  const [winner, loser] = result[0].status() === 200 ? [a, b] : [b, a];
  const overBudget = await attempt(winner, {
    ...choice,
    start: twoHourStart,
    blocks: 4,
  });
  assert.equal(overBudget.status(), 400);
  assert.match((await overBudget.json()).message, /approved hours/);
  assert.equal(
    (await attempt(winner, choice)).status(),
    200,
    "retry returns the same booking",
  );
  assert.equal(
    (
      await attempt(loser, { ...choice, start: start + 1800000, blocks: 1 })
    ).status(),
    409,
    "partial overlap denied",
  );
  assert.equal(
    (
      await attempt(loser, { ...choice, start: start - 14 * 86400000 })
    ).status(),
    400,
    "past date denied",
  );
  const after = await (await winner.ctx.request.get(endpoint)).json();
  assert(
    after.occupied.some((s) => s.start === start && s.unit === choice.unit),
  );
  assert(
    after.occupied.some(
      (s) => s.start === start + 1800000 && s.unit === choice.unit,
    ),
  );
  assert.equal(
    after.occupied.some(
      (s) => Object.hasOwn(s, "requestId") || Object.hasOwn(s, "requesterId"),
    ),
    false,
  );
  const stored = await db.doc("accessRequests/" + winner.requestId).get();
  assert.equal(stored.get("bookings").length, 1);
  await winner.page.goto(origin + "/workspace");
  await expect(winner.page.getByLabel("Reserved lab sessions")).toContainText(
    "scope-01",
  );
  await loser.page.getByRole("button", { name: "Confirm reservation" }).click();
  const picker = loser.page.getByRole("dialog", { name: "Reserve lab time" });
  await expect(picker.getByRole("alert")).toContainText(
    "Choose another session",
  );
  await expect(
    loser.page.getByLabel("Start time (India Standard Time)"),
  ).toHaveValue("0");
  await loser.page
    .getByLabel("Start time (India Standard Time)")
    .selectOption({ index: 1 });
  await loser.page.getByRole("button", { name: "Confirm reservation" }).click();
  await expect(loser.page.getByRole("status")).toContainText(
    "Lab session reserved",
  );
  console.log(
    "Two independently approved students contested one session: one reservation, one conflict. Retry, partial overlap, ownership, time validation and booking another slot passed.",
  );
} finally {
  await browser?.close();
  server.kill();
  for (const id of requests) {
    const held = await db
      .collection("resources")
      .doc(resourceId)
      .collection("bookingSlots")
      .where("requestId", "==", id)
      .get();
    const batch = db.batch();
    for (const doc of held.docs) batch.delete(doc.ref);
    batch.delete(db.doc("accessRequests/" + id));
    await batch.commit();
  }
  for (const uid of createdUsers) {
    await db.doc("users/" + uid).delete();
    await auth.deleteUser(uid);
  }
  await db.terminate();
}
