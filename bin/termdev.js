#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tsFile = join(__dirname, "termdev.ts");

// Support both Bun and Node.js runtime
const argv = typeof Bun !== "undefined" ? Bun.argv : process.argv;

// Try Bun first, then tsx
if (typeof Bun !== "undefined") {
  // Use Bun directly
  await Bun.spawn(["bun", tsFile, ...argv.slice(2)], {
    stdio: "inherit",
  }).exited;
} else {
  // Use tsx for Node.js
  const proc = spawn("tsx", [tsFile, ...argv.slice(2)], {
    stdio: "inherit",
    shell: true,
  });

  proc.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  proc.on("error", (err) => {
    console.error(
      "Error: tsx is required for Node.js. Install it with: npm install -g tsx"
    );
    console.error("Or use Bun: bun install && bun ./bin/termdev.ts");
    process.exit(1);
  });
}
