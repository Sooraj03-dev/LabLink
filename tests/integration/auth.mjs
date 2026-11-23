import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { seedDemo, demoEnvironment } from "../../scripts/seed-demo.mjs";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

const require = createRequire(import.meta.url);
const origin = "http://127.0.0.1:3195";
const authRoot =
  "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:";

const post = (url, body, headers = {}) =>
  fetch(url, {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    redirect: "manual",
  });

async function exchange(idToken) {
  const response = await post(origin + "/api/auth/session", { idToken });
  assert.equal(response.status, 200, "session exchange");
  const header = response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=lax/i);
  return {
    cookie: header.split(";")[0],
    destination: (await response.json()).destination,
  };
}

await seedDemo();
const db = getFirestore(
  initializeApp({ projectId: "demo-lablink" }, "integration-test"),
);
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3195",
  ],
  {
    env: { ...process.env, ...demoEnvironment, LABLINK_APP_ORIGIN: "" },
    windowsHide: true,
    stdio: "inherit",
  },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 60 && server.exitCode === null; attempt++) {
    if ((await fetch(origin + "/login").catch(() => null))?.ok) {
      ready = true;
      break;
    }
    await delay(250);
  }
  assert(ready, "production server ready");
  const anonymous = await fetch(origin + "/workspace", { redirect: "manual" });
  assert.equal(anonymous.headers.get("location"), "/login");
  assert.equal(
    (
      await post(
        origin + "/api/auth/demo",
        { role: "student" },
        { origin: "https://other.example" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await post(origin + "/api/auth/demo", { role: "unknown" })).status,
    400,
  );
  for (const role of ["faculty", "student", "admin"]) {
    const tokenResponse = await post(origin + "/api/auth/demo", { role });
    assert.equal(tokenResponse.status, 200, "demo token for " + role);
    const { token } = await tokenResponse.json();
    const signIn = await post(
      authRoot + "signInWithCustomToken?key=demo-api-key",
      { token, returnSecureToken: true },
    );
    assert.equal(signIn.status, 200, "Firebase custom sign-in");
    const session = await exchange((await signIn.json()).idToken);
    assert.equal(
      session.destination,
      role === "faculty" ? "/approvals" : "/workspace",
    );
    const response = await fetch(origin + "/approvals", {
      headers: { cookie: session.cookie },
      redirect: "manual",
    });
    if (role === "student")
      assert.equal(response.headers.get("location"), "/workspace");
    else assert.match(await response.text(), /Thursday scope crunch/);
    const profile = await db.doc("users/demo-" + role).get();
    assert.equal(profile.get("role"), role);
    const logout = await post(
      origin + "/api/auth/logout",
      {},
      { cookie: session.cookie },
    );
    assert.equal(logout.status, 303);
    assert.match(logout.headers.get("set-cookie"), /lablink_session=;/);
  }
  const simulatedGoogle = JSON.stringify({
    sub: "campus-student",
    email: "student@campus.example",
    email_verified: true,
    name: "Campus student",
  });
  const google = await post(authRoot + "signInWithIdp?key=demo-api-key", {
    postBody: new URLSearchParams({
      providerId: "google.com",
      id_token: simulatedGoogle,
    }).toString(),
    requestUri: origin,
    returnSecureToken: true,
  });
  assert.equal(google.status, 200, "emulated Google sign-in");
  const { idToken, localId } = await google.json();
  assert.equal((await exchange(idToken)).destination, "/workspace");
  assert.equal((await db.doc("users/" + localId).get()).get("role"), "student");
  console.log(
    "All demo roles, Google test account, profiles, reviewer access, sign-out and origin checks passed.",
  );
} finally {
  server.kill();
  await db.terminate();
}
