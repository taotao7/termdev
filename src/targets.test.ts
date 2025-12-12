import { expect, test } from "bun:test";

import { pickTargetByQuery } from "./targets.ts";

test("pickTargetByQuery matches by index", () => {
  const targets = [
    { id: "1", title: "A", url: "https://a.example" },
    { id: "2", title: "B", url: "https://b.example" },
  ];
  const picked = pickTargetByQuery(targets, "1");
  expect(picked.index).toBe(1);
  expect(picked.target?.id).toBe("2");
});

test("pickTargetByQuery matches by substring", () => {
  const targets = [
    { id: "1", title: "Example", url: "https://a.example" },
    { id: "2", title: "Other", url: "https://b.example" },
  ];
  const picked = pickTargetByQuery(targets, "exaMp");
  expect(picked.index).toBe(0);
  expect(picked.target?.id).toBe("1");
});
