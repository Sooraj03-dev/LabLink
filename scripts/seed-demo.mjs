import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { pathToFileURL } from "node:url";

export const demoEnvironment = {
  LABLINK_USE_EMULATORS: "true",
  DEMO_LOGIN_ENABLED: "true",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  GCLOUD_PROJECT: "demo-lablink",
};

export async function seedDemo() {
  Object.assign(process.env, demoEnvironment);
  const app = initializeApp({ projectId: "demo-lablink" }, "seed-demo");
  const auth = getAuth(app);
  const db = getFirestore(app);
  for (const role of ["student", "faculty", "admin"]) {
    const uid = "demo-" + role;
    try {
      await auth.createUser({ uid, displayName: "Demo " + role });
    } catch (error) {
      if (error.code !== "auth/uid-already-exists") throw error;
    }
    await auth.setCustomUserClaims(uid, { role, demo: true });
  }
  const requests = [
    {
      id: "scope-crunch",
      projectTitle: "Thursday scope crunch",
      resourceName: "Mixed-signal oscilloscope",
      hoursNeeded: 2,
    },
    {
      id: "prototype-review",
      projectTitle: "Sensor enclosure fit check",
      resourceName: "FDM 3D printer",
      hoursNeeded: 3,
    },
  ];
  for (const { id, ...request } of requests) {
    const ref = db.collection("accessRequests").doc(id);
    await db.runTransaction(async (tx) => {
      if (!(await tx.get(ref)).exists) {
        tx.create(ref, {
          ...request,
          requesterId: "demo-student",
          reviewerIds: ["demo-faculty", "demo-admin"],
          status: "submitted",
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });
  }
  await db.terminate();
  console.log("Demo users and review requests are ready.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await seedDemo();
}
