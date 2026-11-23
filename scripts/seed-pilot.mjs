import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export async function seedPilot(db, reviewers = []) {
  const schedule = JSON.parse(
    await readFile(
      new URL("../src/lib/booking/pilot.json", import.meta.url),
      "utf8",
    ),
  );
  const doc = db.collection("resources").doc(schedule.resourceId);
  await db.runTransaction(async (tx) => {
    const previous = await tx.get(doc);
    const update = {};
    if (!previous.get("bookingSchedule")) update.bookingSchedule = schedule;
    if (reviewers.length)
      update.reviewerIds = FieldValue.arrayUnion(...reviewers);
    if (Object.keys(update).length) tx.set(doc, update, { merge: true });
  });
  return schedule.resourceId;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const project = process.argv[2],
    reviewer = process.argv[3];
  if (
    !project ||
    project !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  )
    throw new Error(
      "Specify the configured campus project ID. Use seed:emulator for local demos.",
    );
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const app = initializeApp({
    projectId: project,
    ...(email && key
      ? {
          credential: cert({
            projectId: project,
            clientEmail: email,
            privateKey: key.replace(/\\n/g, "\n"),
          }),
        }
      : {}),
  });
  if (reviewer) {
    const account = await getAuth(app).getUser(reviewer);
    if (
      account.disabled ||
      !account.emailVerified ||
      !account.providerData.some(
        (provider) => provider.providerId === "google.com",
      ) ||
      !["faculty", "admin"].includes(account.customClaims?.role)
    )
      throw new Error("Choose an existing verified faculty or admin UID.");
  }
  const db = getFirestore(app);
  try {
    console.log(
      "Pilot schedule ready in " +
        project +
        ": " +
        (await seedPilot(db, reviewer ? [reviewer] : [])),
    );
  } finally {
    await db.terminate();
  }
}
