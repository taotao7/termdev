#!/usr/bin/env tsx

import { run } from "../src/main.ts";

// Support both Bun and Node.js
const argv = typeof Bun !== "undefined" ? Bun.argv : process.argv;
await run(argv.slice(2));
