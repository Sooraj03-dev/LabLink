import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { seedDemo } from "./seed-demo.mjs";

await seedDemo();
const require = createRequire(import.meta.url);
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "dev",
    "--webpack",
    "--hostname",
    "127.0.0.1",
  ],
  { stdio: "inherit", windowsHide: true },
);
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
