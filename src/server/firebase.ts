import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { AuthClientConfig } from "@/lib/auth";

export function emulatorMode() {
  const enabled = process.env.LABLINK_USE_EMULATORS === "true";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const dbHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (enabled || authHost || dbHost) {
    if (
      !enabled ||
      authHost !== "127.0.0.1:9099" ||
      dbHost !== "127.0.0.1:8080"
    ) {
      throw new Error("Use the paired LabLink Auth and Firestore emulators.");
    }
  }
  return enabled;
}

export function demoEnabled() {
  return emulatorMode() && process.env.DEMO_LOGIN_ENABLED === "true";
}

export function clientConfig(): AuthClientConfig | null {
  if (emulatorMode()) {
    return {
      projectId: "demo-lablink",
      apiKey: "demo-api-key",
      appId: "demo-lablink-app",
      authDomain: "demo-lablink.firebaseapp.com",
      emulator: true,
    };
  }
  const {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_API_KEY: apiKey,
    NEXT_PUBLIC_FIREBASE_APP_ID: appId,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: authDomain,
  } = process.env;
  if (!projectId || !apiKey || !appId || !authDomain) return null;
  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_PROJECT_ID !== projectId
  )
    throw new Error("Firebase project IDs must match.");
  return { projectId, apiKey, appId, authDomain, emulator: false };
}

function adminApp() {
  const config = clientConfig();
  if (!config) throw new Error("Firebase is not configured.");
  const existing = getApps().find((app) => app.name === "lablink");
  if (existing) return existing;
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!config.emulator && Boolean(email) !== Boolean(key))
    throw new Error("Incomplete Firebase Admin credentials.");
  const credential =
    !config.emulator && email && key
      ? cert({
          projectId: config.projectId,
          clientEmail: email,
          privateKey: key.replace(/\\n/g, "\n"),
        })
      : undefined;
  return initializeApp(
    { projectId: config.projectId, ...(credential && { credential }) },
    "lablink",
  );
}

export const adminAuth = () => getAuth(adminApp());
export const database = () => getFirestore(adminApp());
