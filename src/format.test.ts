import { expect, test } from "bun:test";

import { formatConsoleEvent, formatRemoteObject, formatTime } from "./format.ts";

test("formatRemoteObject prefers value", () => {
  expect(formatRemoteObject({ value: "hello" })).toBe("hello");
  expect(formatRemoteObject({ value: 123 })).toContain("123");
});

test("formatRemoteObject uses description", () => {
  expect(formatRemoteObject({ description: "MyObj" })).toBe("MyObj");
});

test("formatRemoteObject formats preview objects", () => {
  const s = formatRemoteObject({
    type: "object",
    className: "Window",
    preview: {
      overflow: true,
      properties: [
        { name: "location", type: "object", value: "Location" },
        { name: "document", type: "object", value: "HTMLDocument" },
      ],
    },
  });
  expect(s).toContain("Window");
  expect(s).toContain("location");
  expect(s).toContain("document");
});

test("formatTime returns HH:MM:SS", () => {
  const s = formatTime(0);
  expect(s).toMatch(/^\d{2}:\d{2}:\d{2}$/);
});

test("formatConsoleEvent includes type and args", () => {
  const s = formatConsoleEvent({ timestamp: 0, type: "log", args: [{ value: "a" }, { value: 1 }] });
  expect(s).toContain("console.log");
  expect(s).toContain("a");
  expect(s).toContain("1");
});
