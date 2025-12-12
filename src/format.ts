import { inspect } from "node:util";

function toDateFromCdpTimestamp(ts: number): Date {
  // CDP commonly uses seconds-since-epoch for timestamps, but some fields may be ms.
  if (!Number.isFinite(ts)) return new Date(0);
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms);
}

export function formatTime(ts: number): string {
  const d = toDateFromCdpTimestamp(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatRemoteObject(obj: any): string {
  if (!obj || typeof obj !== "object") return String(obj);

  if (typeof obj.unserializableValue === "string") return obj.unserializableValue;

  if ("value" in obj) {
    const v = obj.value;
    if (typeof v === "string") return v;
    return inspect(v, {
      depth: 4,
      maxArrayLength: 50,
      breakLength: 120,
      colors: false,
      compact: true,
    });
  }

  const className = typeof obj.className === "string" ? obj.className : undefined;
  const description = typeof obj.description === "string" ? obj.description : undefined;

  const preview = obj.preview;
  if (preview && typeof preview === "object") {
    const head = className ?? description ?? (typeof preview.description === "string" ? preview.description : undefined) ?? "Object";
    const body = formatObjectPreview(preview);
    return body ? `${head} ${body}` : head;
  }

  if (className) return `#<${className}>`;

  if (description) {
    const m = description.match(/^\[object\s+(.+?)\]$/);
    if (m?.[1]) return `#<${m[1]}>`;
    return description;
  }

  if (typeof obj.type === "string") return `[${obj.type}]`;
  return inspect(obj, { depth: 2, colors: false });
}

function formatObjectPreview(preview: any): string {
  const subtype = typeof preview.subtype === "string" ? preview.subtype : undefined;
  const overflow = Boolean(preview.overflow);
  const props = Array.isArray(preview.properties) ? preview.properties : [];
  const entries = Array.isArray(preview.entries) ? preview.entries : [];

  if (subtype === "array") {
    const items = props
      .filter((p: any) => typeof p?.name === "string" && /^\d+$/.test(p.name))
      .sort((a: any, b: any) => Number(a.name) - Number(b.name))
      .slice(0, 10)
      .map((p: any) => formatPreviewValue(p));
    const tail = overflow ? ", …" : "";
    return `[${items.join(", ")}${tail}]`;
  }

  if (subtype === "map") {
    const pairs = entries.slice(0, 8).map((e: any) => {
      const k = e?.key ? formatPreviewValue(e.key) : "?";
      const v = e?.value ? formatPreviewValue(e.value) : "?";
      return `${k} => ${v}`;
    });
    const tail = overflow ? ", …" : "";
    return `{${pairs.join(", ")}${tail}}`;
  }

  if (subtype === "set") {
    const items = entries
      .slice(0, 8)
      .map((e: any) => (e?.value ? formatPreviewValue(e.value) : "?"));
    const tail = overflow ? ", …" : "";
    return `{${items.join(", ")}${tail}}`;
  }

  // default object/function preview
  const pairs = props
    .slice(0, 12)
    .map((p: any) => {
      const name = typeof p?.name === "string" ? p.name : "?";
      return `${name}: ${formatPreviewValue(p)}`;
    });
  const tail = overflow ? ", …" : "";
  return `{${pairs.join(", ")}${tail}}`;
}

function formatPreviewValue(p: any): string {
  // PropertyPreview / RemoteObjectPreview shapes both show `value` as string.
  if (p && typeof p === "object") {
    if (typeof p.value === "string") return p.value;
    if (typeof p.description === "string") return p.description;
    if (typeof p.type === "string") {
      if (p.type === "function") return "ƒ";
      if (p.type === "undefined") return "undefined";
      if (p.type === "object") return p.subtype ? String(p.subtype) : "Object";
      return p.type;
    }
  }
  return String(p);
}

export function formatConsoleEvent(params: any): string {
  const time = formatTime(params?.timestamp ?? Date.now());
  const type = String(params?.type ?? "log");
  const args = Array.isArray(params?.args) ? params.args : [];
  const msg = args.map(formatRemoteObject).join(" ");
  return `[${time}] console.${type} ${msg}`.trimEnd();
}

export function formatConsoleMessageAdded(params: any): string {
  const msg = params?.message ?? params;
  const time = formatTime(msg?.timestamp ?? Date.now());
  const level = String(msg?.level ?? "log");
  const text = String(msg?.text ?? "");
  const url = msg?.url ? ` (${msg.url}:${msg.line}:${msg.column})` : "";
  return `[${time}] console.${level} ${text}${url}`.trimEnd();
}

export function formatLogEntryAdded(params: any): string {
  const entry = params?.entry ?? params;
  const time = formatTime(entry?.timestamp ?? Date.now());
  const level = String(entry?.level ?? "info");
  const text = String(entry?.text ?? "");
  const url = entry?.url ? ` (${entry.url})` : "";
  return `[${time}] log.${level} ${text}${url}`.trimEnd();
}

export function formatExceptionThrown(params: any): string {
  const time = formatTime(params?.timestamp ?? Date.now());
  const details = params?.exceptionDetails;
  const text = details?.text ? String(details.text) : "exception";
  const exception = details?.exception ? formatRemoteObject(details.exception) : "";
  const url = details?.url ? ` (${details.url}:${details.lineNumber}:${details.columnNumber})` : "";
  const parts = [
    `[${time}] exception ${text}${url}`,
    exception ? `  ${exception}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}
