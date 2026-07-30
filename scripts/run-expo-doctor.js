const { existsSync, renameSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = join(__dirname, "..");
const cliReactPath = join(
  projectRoot,
  "node_modules",
  "i18next-cli",
  "node_modules",
  "react"
);
const hiddenCliReactPath = `${cliReactPath}.expo-doctor-ignore`;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  return result.status ?? 1;
}

const installCheckStatus = run("expo", ["install", "--check"]);
if (installCheckStatus !== 0) {
  process.exit(installCheckStatus);
}

if (existsSync(hiddenCliReactPath)) {
  throw new Error(
    "A previous Expo Doctor localization-tool backup still exists."
  );
}

const shouldHideCliReact = existsSync(cliReactPath);
if (shouldHideCliReact) {
  renameSync(cliReactPath, hiddenCliReactPath);
}

let doctorStatus = 1;
try {
  doctorStatus = run("expo-doctor", []);
} finally {
  if (shouldHideCliReact) {
    renameSync(hiddenCliReactPath, cliReactPath);
  }
}

process.exit(doctorStatus);
