import type { CdpTarget } from "./types.ts";

export function formatTargetLine(t: CdpTarget): string {
  const title = (t.title ?? "").trim() || "(no title)";
  const url = (t.url ?? "").trim();
  const type = (t.type ?? "").trim();
  const suffix = [type ? `type=${type}` : "", url ? url : ""].filter(Boolean).join(" | ");
  return suffix ? `${title}  —  ${suffix}` : title;
}

export function pickTargetByQuery(targets: CdpTarget[], query: string): { target?: CdpTarget; index: number } {
  const q = query.trim();
  if (!q) return { index: -1 };

  const asIndex = Number(q);
  if (Number.isInteger(asIndex) && asIndex >= 0 && asIndex < targets.length) {
    return { target: targets[asIndex], index: asIndex };
  }

  const qLower = q.toLowerCase();
  const idx = targets.findIndex((t) => {
    const title = (t.title ?? "").toLowerCase();
    const url = (t.url ?? "").toLowerCase();
    return title.includes(qLower) || url.includes(qLower);
  });

  return { target: idx >= 0 ? targets[idx] : undefined, index: idx };
}
