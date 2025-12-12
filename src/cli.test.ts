import { expect, test } from "bun:test";

import { parseCli } from "./cli.ts";

test("parseCli defaults", () => {
  const opts = parseCli([]);
  expect(opts.host).toBe("127.0.0.1");
  expect(opts.port).toBe(9222);
  expect(opts.network).toBe(false);
  expect(opts.pollMs).toBe(2000);
  expect(opts.help).toBe(false);
});

test("parseCli parses host/port/target/network", () => {
  const opts = parseCli([
    "--host",
    "localhost",
    "--port",
    "9333",
    "--target",
    "example.com",
    "--network",
    "--poll",
    "1000",
  ]);
  expect(opts.host).toBe("localhost");
  expect(opts.port).toBe(9333);
  expect(opts.targetQuery).toBe("example.com");
  expect(opts.network).toBe(true);
  expect(opts.pollMs).toBe(1000);
});

test("parseCli throws on unknown argument", () => {
  expect(() => parseCli(["--nope"])).toThrow();
});
