export type CliOptions = {
  host: string;
  port: number;
  targetQuery?: string;
  network: boolean;
  pollMs: number;
  help: boolean;
};

export const HELP_TEXT = `termdev (Bun + TS)

Usage:
  termdev [options]

  # or inside this repo:
  bun run termdev -- [options]

Options:
  --host <host>         Chrome remote debugging host (default: 127.0.0.1)
  --port <port>         Chrome remote debugging port (default: 9222)
  --target <query>      Auto-attach to first target whose title/url matches query
  --network             Also show basic Network events
  --poll <ms>           Auto refresh targets every N ms (default: 2000, 0 disables)
  --help, -h            Show help

Chrome launch example:
  # macOS
  open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp

  # Linux/Windows (conceptually)
  chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp
`;

export function parseCli(argv: string[]): CliOptions {
  const opts: CliOptions = {
    host: "127.0.0.1",
    port: 9222,
    network: false,
    pollMs: 2000,
    help: false,
  };

  const args = [...argv];
  while (args.length > 0) {
    const cur = args.shift();
    if (!cur) break;

    if (cur === "--help" || cur === "-h") {
      opts.help = true;
      continue;
    }

    if (cur === "--network") {
      opts.network = true;
      continue;
    }

    if (cur === "--no-network") {
      opts.network = false;
      continue;
    }

    if (cur === "--poll") {
      const v = args.shift();
      if (!v) throw new Error("--poll requires a value");
      const ms = Number(v);
      if (!Number.isFinite(ms) || ms < 0) throw new Error(`Invalid --poll: ${v}`);
      opts.pollMs = ms;
      continue;
    }

    if (cur === "--no-poll") {
      opts.pollMs = 0;
      continue;
    }

    if (cur === "--host") {
      const v = args.shift();
      if (!v) throw new Error("--host requires a value");
      opts.host = v;
      continue;
    }

    if (cur === "--port") {
      const v = args.shift();
      if (!v) throw new Error("--port requires a value");
      const p = Number(v);
      if (!Number.isFinite(p) || p <= 0) throw new Error(`Invalid --port: ${v}`);
      opts.port = p;
      continue;
    }

    if (cur === "--target") {
      const v = args.shift();
      if (!v) throw new Error("--target requires a value");
      opts.targetQuery = v;
      continue;
    }

    throw new Error(`Unknown argument: ${cur}`);
  }

  return opts;
}
