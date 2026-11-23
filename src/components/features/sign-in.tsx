"use client";

import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  browserPopupRedirectResolver,
  connectAuthEmulator,
  getRedirectResult,
  GoogleAuthProvider,
  initializeAuth,
  inMemoryPersistence,
  signInWithCustomToken,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { type AuthClientConfig, type Role, roleSchema } from "@/lib/auth";

let client: Auth | undefined;
function authFor(config: AuthClientConfig) {
  if (client) return client;
  const { emulator, ...options } = config;
  client = initializeAuth(initializeApp(options, "lablink"), {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  if (emulator)
    connectAuthEmulator(client, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
  return client;
}

async function post(path: string, body: object) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "Sign-in is temporarily unavailable.");
  return result;
}

async function startSession(auth: Auth, user: User, resource?: string) {
  try {
    const result = await post("/api/auth/session", {
      idToken: await user.getIdToken(),
    });
    window.location.assign(
      resource
        ? "/workspace?resource=" + encodeURIComponent(resource)
        : result.destination === "/approvals"
          ? "/approvals"
          : "/workspace",
    );
  } finally {
    await signOut(auth);
  }
}

function authMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error ? error.code : "";
  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  )
    return "Sign-in was cancelled. Choose an account to try again.";
  if (code === "auth/network-request-failed" || error instanceof TypeError)
    return "Could not reach the sign-in service. Check your connection and try again.";
  if (code) return "Sign-in could not be completed. Please try again.";
  return error instanceof Error
    ? error.message
    : "Please try signing in again.";
}

export function SignIn({
  config,
  demo,
  resource,
}: {
  config: AuthClientConfig;
  demo: boolean;
  resource?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const checkedRedirect = useRef(false);
  useEffect(() => {
    if (
      checkedRedirect.current ||
      !sessionStorage.getItem("lablink-google-redirect")
    )
      return;
    checkedRedirect.current = true;
    sessionStorage.removeItem("lablink-google-redirect");
    async function finish() {
      setBusy(true);
      try {
        const auth = authFor(config);
        const result = await getRedirectResult(auth);
        if (!result)
          throw new Error("Sign-in was interrupted. Please try again.");
        await startSession(auth, result.user, resource);
      } catch (error) {
        setMessage(authMessage(error));
        setBusy(false);
      }
    }
    void finish();
  }, [config, resource]);

  async function login(role?: Role) {
    setBusy(true);
    setMessage("");
    try {
      const auth = authFor(config);
      if (role) {
        const { token } = await post("/api/auth/demo", { role });
        const result = await signInWithCustomToken(auth, token);
        await startSession(auth, result.user, resource);
      } else {
        const provider = new GoogleAuthProvider();
        try {
          const result = await signInWithPopup(auth, provider);
          await startSession(auth, result.user, resource);
        } catch (error) {
          if (!(
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "auth/popup-blocked"
          ))
            throw error;
          sessionStorage.setItem("lablink-google-redirect", "1");
          await signInWithRedirect(auth, provider);
        }
      }
    } catch (error) {
      setMessage(authMessage(error));
      setBusy(false);
    }
  }

  return (
    <div className="auth-actions">
      <button
        className="button button-primary"
        disabled={busy}
        onClick={() => void login()}
      >
        Continue with Google
      </button>
      {demo && (
        <section aria-labelledby="demo-heading">
          <h2 id="demo-heading">Try the demo</h2>
          <p>Choose a role to explore the sample workspace.</p>
          <div className="hero-actions">
            {roleSchema.options.map((role) => (
              <button
                className="button button-outline"
                key={role}
                disabled={busy}
                onClick={() => void login(role)}
              >
                {role[0]?.toUpperCase()}
                {role.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}
      <p role="status">{message || (busy ? "Signing in…" : "")}</p>
    </div>
  );
}
