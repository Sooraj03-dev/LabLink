import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const origin = "http://127.0.0.1:3199";
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3199",
  ],
  {
    windowsHide: true,
    stdio: "inherit",
    env: {
      ...process.env,
      AI_ENABLED: "false",
      GEMINI_API_KEY: "",
      LABLINK_APP_ORIGIN: "",
    },
  },
);
const post = (body, requestOrigin = origin) =>
  fetch(origin + "/api/assistant", {
    method: "POST",
    headers: { origin: requestOrigin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
try {
  let ready = false;
  for (let i = 0; i < 60 && server.exitCode === null; i++) {
    if ((await fetch(origin + "/assistant").catch(() => null))?.ok) {
      ready = true;
      break;
    }
    await delay(250);
  }
  assert(
    ready && server.exitCode === null,
    "isolated assistant server is ready",
  );
  const input = {
    mode: "plan",
    description: "ESP32 wireless BLE sensor board",
  };
  const response = await post(input);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.source, "catalogue");
  assert.match(data.notice, /switched off/i);
  assert.equal(data.matches[0].id, "esp32-prototyping-kit");
  assert.equal(data.matches[0].hours, null);
  assert.equal((await post(input, "https://outside.example")).status, 403);
  assert.equal(
    (await post({ ...input, description: "x".repeat(1201) })).status,
    400,
  );
  assert.equal(
    (await post({ ...input, description: "x".repeat(9000) })).status,
    413,
  );
  assert.equal(
    (await post({ mode: "compare", description: "", resourceId: "unknown" }))
      .status,
    400,
  );
  console.log(
    "Assistant fallback, request validation and origin checks passed.",
  );
} finally {
  server.kill();
}
