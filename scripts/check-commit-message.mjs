import { readFileSync } from "node:fs";

const [messagePath] = process.argv.slice(2);
const [subject] = readFileSync(messagePath, "utf8").split(/\r?\n/);
const conventional =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([\w/-]+\))?!?: \S/;

if (
  !conventional.test(subject) &&
  !/^(Merge |Revert "|fixup! |squash! )/.test(subject)
) {
  console.error(
    "Use a Conventional Commit subject, such as chore: scaffold project",
  );
  process.exitCode = 1;
}
