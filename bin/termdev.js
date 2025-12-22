#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/cli.ts
var HELP_TEXT = `termdev (Bun + TS)

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
function parseCli(argv) {
  const opts = {
    host: "127.0.0.1",
    port: 9222,
    network: false,
    pollMs: 2000,
    help: false
  };
  const args = [...argv];
  while (args.length > 0) {
    const cur = args.shift();
    if (!cur)
      break;
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
      if (!v)
        throw new Error("--poll requires a value");
      const ms = Number(v);
      if (!Number.isFinite(ms) || ms < 0)
        throw new Error(`Invalid --poll: ${v}`);
      opts.pollMs = ms;
      continue;
    }
    if (cur === "--no-poll") {
      opts.pollMs = 0;
      continue;
    }
    if (cur === "--host") {
      const v = args.shift();
      if (!v)
        throw new Error("--host requires a value");
      opts.host = v;
      continue;
    }
    if (cur === "--port") {
      const v = args.shift();
      if (!v)
        throw new Error("--port requires a value");
      const p = Number(v);
      if (!Number.isFinite(p) || p <= 0)
        throw new Error(`Invalid --port: ${v}`);
      opts.port = p;
      continue;
    }
    if (cur === "--target") {
      const v = args.shift();
      if (!v)
        throw new Error("--target requires a value");
      opts.targetQuery = v;
      continue;
    }
    throw new Error(`Unknown argument: ${cur}`);
  }
  return opts;
}

// src/tui.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, render, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";

// src/cdp.ts
import CDPImport from "chrome-remote-interface";
var CDP = CDPImport?.default ?? CDPImport;
async function listTargets(opts) {
  const targets = await CDP.List({ host: opts.host, port: opts.port });
  return targets ?? [];
}
async function connectToTarget(target, opts) {
  const targetOpt = target.webSocketDebuggerUrl ?? target.id;
  return await CDP({ host: opts.host, port: opts.port, target: targetOpt });
}
async function safeCloseClient(client) {
  if (!client)
    return;
  try {
    await client.close();
  } catch {}
}

// src/format.ts
import { inspect } from "node:util";
function toDateFromCdpTimestamp(ts) {
  if (!Number.isFinite(ts))
    return new Date(0);
  const ms = ts > 1000000000000 ? ts : ts * 1000;
  return new Date(ms);
}
function formatTime(ts) {
  const d = toDateFromCdpTimestamp(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function formatRemoteObject(obj) {
  if (!obj || typeof obj !== "object")
    return String(obj);
  if (typeof obj.unserializableValue === "string")
    return obj.unserializableValue;
  if ("value" in obj) {
    const v = obj.value;
    if (typeof v === "string")
      return v;
    return inspect(v, {
      depth: 4,
      maxArrayLength: 50,
      breakLength: 120,
      colors: false,
      compact: true
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
  if (className)
    return `#<${className}>`;
  if (description) {
    const m = description.match(/^\[object\s+(.+?)\]$/);
    if (m?.[1])
      return `#<${m[1]}>`;
    return description;
  }
  if (typeof obj.type === "string")
    return `[${obj.type}]`;
  return inspect(obj, { depth: 2, colors: false });
}
function formatObjectPreview(preview) {
  const subtype = typeof preview.subtype === "string" ? preview.subtype : undefined;
  const overflow = Boolean(preview.overflow);
  const props = Array.isArray(preview.properties) ? preview.properties : [];
  const entries = Array.isArray(preview.entries) ? preview.entries : [];
  if (subtype === "array") {
    const items = props.filter((p) => typeof p?.name === "string" && /^\d+$/.test(p.name)).sort((a, b) => Number(a.name) - Number(b.name)).slice(0, 10).map((p) => formatPreviewValue(p));
    const tail2 = overflow ? ", …" : "";
    return `[${items.join(", ")}${tail2}]`;
  }
  if (subtype === "map") {
    const pairs2 = entries.slice(0, 8).map((e) => {
      const k = e?.key ? formatPreviewValue(e.key) : "?";
      const v = e?.value ? formatPreviewValue(e.value) : "?";
      return `${k} => ${v}`;
    });
    const tail2 = overflow ? ", …" : "";
    return `{${pairs2.join(", ")}${tail2}}`;
  }
  if (subtype === "set") {
    const items = entries.slice(0, 8).map((e) => e?.value ? formatPreviewValue(e.value) : "?");
    const tail2 = overflow ? ", …" : "";
    return `{${items.join(", ")}${tail2}}`;
  }
  const pairs = props.slice(0, 12).map((p) => {
    const name = typeof p?.name === "string" ? p.name : "?";
    return `${name}: ${formatPreviewValue(p)}`;
  });
  const tail = overflow ? ", …" : "";
  return `{${pairs.join(", ")}${tail}}`;
}
function formatPreviewValue(p) {
  if (p && typeof p === "object") {
    if (typeof p.value === "string")
      return p.value;
    if (typeof p.description === "string")
      return p.description;
    if (typeof p.type === "string") {
      if (p.type === "function")
        return "ƒ";
      if (p.type === "undefined")
        return "undefined";
      if (p.type === "object")
        return p.subtype ? String(p.subtype) : "Object";
      return p.type;
    }
  }
  return String(p);
}

// src/targets.ts
function pickTargetByQuery(targets, query) {
  const q = query.trim();
  if (!q)
    return { index: -1 };
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

// src/tui.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
var LOG_MAX_LINES = 5000;
var HEADER_HEIGHT = 1;
var FOOTER_HEIGHT = 1;
var MIN_ROWS = 12;
var TARGET_LINES_PER_ITEM = 2;
function splitLines(s) {
  return String(s).split(`
`);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function useTerminalSizeFallback() {
  const { stdout } = useStdout();
  const rows = stdout?.rows;
  const columns = stdout?.columns;
  return {
    rows: typeof rows === "number" && rows > 0 ? rows : 30,
    columns: typeof columns === "number" && columns > 0 ? columns : 100
  };
}
function truncate(s, max) {
  if (max <= 0)
    return "";
  if (s.length <= max)
    return s;
  if (max === 1)
    return "…";
  return `${s.slice(0, max - 1)}…`;
}
function tryPrettifyJson(body) {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return { formatted: body, isJson: false };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const pretty = JSON.stringify(parsed, null, 2);
    return { formatted: pretty, isJson: true };
  } catch {
    return { formatted: body, isJson: false };
  }
}
function formatResponseBody(body, base64Encoded) {
  if (base64Encoded) {
    const preview = body.length > 100 ? body.slice(0, 100) + "..." : body;
    return { lines: [preview], typeHint: "(base64 encoded)" };
  }
  const { formatted, isJson } = tryPrettifyJson(body);
  const lines = splitLines(formatted);
  const typeHint = isJson ? "(json, formatted)" : "(text)";
  return { lines, typeHint };
}
function classifyLogLine(line) {
  const l = line.toLowerCase();
  if (l.includes("exception") || l.includes("console.error") || l.includes("log.error"))
    return { color: "red" };
  if (l.includes("warn") || l.includes("warning") || l.includes("console.warn") || l.includes("log.warning")) {
    return { color: "yellow" };
  }
  if (l.startsWith("[eval]"))
    return { color: "green" };
  if (l.startsWith("eval>") || l.startsWith("[eval]"))
    return { color: "green" };
  if (l.includes("[props]"))
    return { color: "cyan" };
  if (l.includes("net.request"))
    return { color: "cyan", dim: true };
  if (l.includes("net.response"))
    return { color: "cyan", dim: true };
  if (l.startsWith("[hint]"))
    return { color: "magenta" };
  if (l.startsWith("[attached]") || l.startsWith("[transport]"))
    return { color: "green" };
  const trimmed = line.trimStart();
  if (/^"[^"]+"\s*:/.test(trimmed))
    return { color: "cyan" };
  if (/^\s*(null|true|false|-?\d+\.?\d*)\s*,?\s*$/.test(trimmed))
    return { color: "yellow" };
  return { dim: false };
}
function isObjectExpandable(obj) {
  return Boolean(obj && typeof obj === "object" && typeof obj.objectId === "string" && obj.objectId.length > 0);
}
function flattenLogTree(nodes, parentId = null, indent = 0) {
  const out = [];
  for (const n of nodes) {
    const expandable = n.kind === "entry" ? Array.isArray(n.args) && n.args.length > 0 || Array.isArray(n.children) && n.children.length > 0 || Boolean(n.loading) : n.kind === "arg" ? isObjectExpandable(n.object) : n.kind === "prop" ? isObjectExpandable(n.value) : false;
    const expanded = Boolean(n.expanded);
    const text = (() => {
      if (n.kind === "text")
        return n.text ?? "";
      if (n.kind === "meta")
        return n.text ?? "";
      if (n.kind === "entry") {
        const label = n.label ?? "";
        const args = Array.isArray(n.args) ? n.args : [];
        const preview = args.map(formatRemoteObject).join(" ");
        return preview ? `${label} ${preview}` : label;
      }
      if (n.kind === "arg") {
        const obj = n.object;
        return obj ? formatRemoteObject(obj) : "";
      }
      if (n.kind === "prop") {
        const name = n.name ?? "?";
        const v = n.value;
        return `${name}: ${v ? formatRemoteObject(v) : "undefined"}`;
      }
      return n.text ?? "";
    })();
    out.push({ nodeId: n.id, parentId, indent, text, expandable, expanded });
    if (expanded && Array.isArray(n.children) && n.children.length > 0) {
      out.push(...flattenLogTree(n.children, n.id, indent + 1));
    }
  }
  return out;
}
function updateNodeById(nodes, id, updater) {
  let changed = false;
  const next = nodes.map((n) => {
    if (n.id === id) {
      changed = true;
      return updater(n);
    }
    if (n.children && n.children.length > 0) {
      const updatedChildren = updateNodeById(n.children, id, updater);
      if (updatedChildren !== n.children) {
        changed = true;
        return { ...n, children: updatedChildren };
      }
    }
    return n;
  });
  return changed ? next : nodes;
}
function findNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id)
      return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found)
        return found;
    }
  }
  return;
}
function serializeNodeDeep(node, indent = 0) {
  const pad = "  ".repeat(indent);
  const line = (() => {
    if (node.kind === "text" || node.kind === "meta")
      return `${pad}${node.text ?? ""}`.trimEnd();
    if (node.kind === "entry") {
      const label = node.label ?? "";
      const args = Array.isArray(node.args) ? node.args : [];
      const preview = args.map(formatRemoteObject).join(" ");
      return `${pad}${preview ? `${label} ${preview}`.trimEnd() : label}`.trimEnd();
    }
    if (node.kind === "arg") {
      return `${pad}${node.object ? formatRemoteObject(node.object) : ""}`.trimEnd();
    }
    if (node.kind === "prop") {
      const name = node.name ?? "?";
      return `${pad}${name}: ${node.value ? formatRemoteObject(node.value) : "undefined"}`.trimEnd();
    }
    return `${pad}${node.text ?? ""}`.trimEnd();
  })();
  const out = [line];
  const children = Array.isArray(node.children) ? node.children : [];
  for (const c of children)
    out.push(...serializeNodeDeep(c, indent + 1));
  return out;
}
function serializeBodyOnly(node) {
  if (node.kind === "meta") {
    return [];
  }
  if (node.kind === "text") {
    return [node.text ?? ""];
  }
  if (node.kind === "entry" && node.net?.role === "body") {
    const children2 = Array.isArray(node.children) ? node.children : [];
    const out2 = [];
    for (const c of children2) {
      out2.push(...serializeBodyOnly(c));
    }
    return out2;
  }
  const children = Array.isArray(node.children) ? node.children : [];
  const out = [];
  for (const c of children) {
    out.push(...serializeBodyOnly(c));
  }
  return out;
}
async function copyToClipboard(text) {
  const trimmed = text.replace(/\s+$/g, "") + `
`;
  try {
    const { spawn } = await import("child_process");
    const runClipboard = (args) => {
      return new Promise((resolve) => {
        const cmd = args[0];
        if (!cmd) {
          resolve(false);
          return;
        }
        const proc = spawn(cmd, args.slice(1), {
          stdio: ["pipe", "ignore", "ignore"]
        });
        if (proc.stdin) {
          proc.stdin.write(trimmed);
          proc.stdin.end();
        }
        proc.on("close", (code) => {
          resolve(code === 0);
        });
        proc.on("error", () => {
          resolve(false);
        });
      });
    };
    if (process.platform === "darwin") {
      const result = await runClipboard(["pbcopy"]);
      if (result)
        return true;
    }
    const wlResult = await runClipboard(["wl-copy"]);
    if (wlResult)
      return true;
    const xclipResult = await runClipboard([
      "xclip",
      "-selection",
      "clipboard"
    ]);
    if (xclipResult)
      return true;
  } catch {}
  return false;
}
function App({ opts }) {
  const { exit } = useApp();
  const { rows, columns } = useTerminalSizeFallback();
  const safeRows = Math.max(MIN_ROWS, rows);
  const [host, setHost] = useState(opts.host);
  const [port] = useState(opts.port);
  const [targets, setTargets] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attachedIndex, setAttachedIndex] = useState(null);
  const [status, setStatus] = useState(`connecting to ${opts.host}:${opts.port}...`);
  const [focus, setFocus] = useState("targets");
  const [rightTab, setRightTab] = useState("logs");
  const [logTree, setLogTree] = useState([]);
  const [followTail, setFollowTail] = useState(true);
  const [logScrollTop, setLogScrollTop] = useState(0);
  const [selectedLogNodeId, setSelectedLogNodeId] = useState(null);
  const [netTree, setNetTree] = useState([]);
  const [followNetTail, setFollowNetTail] = useState(true);
  const [netScrollTop, setNetScrollTop] = useState(0);
  const [selectedNetNodeId, setSelectedNetNodeId] = useState(null);
  const [netSearchOpen, setNetSearchOpen] = useState(false);
  const [netSearchQuery, setNetSearchQuery] = useState("");
  const [targetScrollTop, setTargetScrollTop] = useState(0);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalText, setEvalText] = useState("");
  const clientRef = useRef(null);
  const hasShownConnectHelpRef = useRef(false);
  const isAttachingRef = useRef(false);
  const lastFetchErrorRef = useRef(null);
  const isExpandingRef = useRef(false);
  const selectedTargetIdRef = useRef(null);
  const attachedTargetIdRef = useRef(null);
  const nextNodeIdRef = useRef(0);
  const newNodeId = () => `n${++nextNodeIdRef.current}`;
  useEffect(() => {
    selectedTargetIdRef.current = targets[selectedIndex]?.id ?? null;
  }, [targets, selectedIndex]);
  useEffect(() => {
    attachedTargetIdRef.current = attachedIndex == null ? null : targets[attachedIndex]?.id ?? null;
  }, [targets, attachedIndex]);
  const mainHeight = Math.max(1, safeRows - HEADER_HEIGHT - FOOTER_HEIGHT);
  const panelInnerHeight = Math.max(3, mainHeight - 2);
  const rightReserved = evalOpen || netSearchOpen ? 2 : 1;
  const visibleLogLines = Math.max(3, panelInnerHeight - 1 - rightReserved);
  const visibleTargetItems = Math.max(1, Math.floor((panelInnerHeight - 1) / TARGET_LINES_PER_ITEM));
  const flatLogs = useMemo(() => flattenLogTree(logTree), [logTree]);
  const filteredNetTree = useMemo(() => {
    const q = netSearchQuery.trim().toLowerCase();
    if (!q)
      return netTree;
    return netTree.filter((n) => {
      const hay = `${n.label ?? ""} ${n.text ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [netTree, netSearchQuery]);
  const flatNet = useMemo(() => flattenLogTree(filteredNetTree), [filteredNetTree]);
  const selectedLogIndex = useMemo(() => {
    if (!flatLogs.length)
      return -1;
    if (!selectedLogNodeId)
      return flatLogs.length - 1;
    const idx = flatLogs.findIndex((l) => l.nodeId === selectedLogNodeId);
    return idx >= 0 ? idx : flatLogs.length - 1;
  }, [flatLogs, selectedLogNodeId]);
  const selectedNetIndex = useMemo(() => {
    if (!flatNet.length)
      return -1;
    if (!selectedNetNodeId)
      return flatNet.length - 1;
    const idx = flatNet.findIndex((l) => l.nodeId === selectedNetNodeId);
    return idx >= 0 ? idx : flatNet.length - 1;
  }, [flatNet, selectedNetNodeId]);
  useEffect(() => {
    if (!flatLogs.length) {
      setSelectedLogNodeId(null);
      setLogScrollTop(0);
      return;
    }
    if (!selectedLogNodeId) {
      setSelectedLogNodeId(flatLogs[flatLogs.length - 1]?.nodeId ?? null);
    }
    if (followTail) {
      setSelectedLogNodeId(flatLogs[flatLogs.length - 1]?.nodeId ?? null);
      setLogScrollTop(Math.max(0, flatLogs.length - visibleLogLines));
      return;
    }
    setLogScrollTop((top) => clamp(top, 0, Math.max(0, flatLogs.length - visibleLogLines)));
  }, [flatLogs.length, followTail, visibleLogLines]);
  useEffect(() => {
    if (!flatNet.length) {
      setSelectedNetNodeId(null);
      setNetScrollTop(0);
      return;
    }
    if (!selectedNetNodeId) {
      setSelectedNetNodeId(flatNet[flatNet.length - 1]?.nodeId ?? null);
    }
    if (followNetTail) {
      setSelectedNetNodeId(flatNet[flatNet.length - 1]?.nodeId ?? null);
      setNetScrollTop(Math.max(0, flatNet.length - visibleLogLines));
      return;
    }
    setNetScrollTop((top) => clamp(top, 0, Math.max(0, flatNet.length - visibleLogLines)));
  }, [flatNet.length, followNetTail, visibleLogLines]);
  useEffect(() => {
    if (netSearchQuery.trim())
      setFollowNetTail(false);
  }, [netSearchQuery]);
  useEffect(() => {
    if (focus !== "right" || rightTab !== "logs")
      return;
    if (!flatLogs.length)
      return;
    if (selectedLogIndex < 0)
      return;
    setLogScrollTop((top) => {
      const maxTop = Math.max(0, flatLogs.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedLogIndex < nextTop)
        nextTop = selectedLogIndex;
      if (selectedLogIndex >= nextTop + visibleLogLines)
        nextTop = selectedLogIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, selectedLogIndex, flatLogs.length, visibleLogLines]);
  useEffect(() => {
    if (focus !== "right" || rightTab !== "network")
      return;
    if (!flatNet.length)
      return;
    if (selectedNetIndex < 0)
      return;
    setNetScrollTop((top) => {
      const maxTop = Math.max(0, flatNet.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedNetIndex < nextTop)
        nextTop = selectedNetIndex;
      if (selectedNetIndex >= nextTop + visibleLogLines)
        nextTop = selectedNetIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, rightTab, selectedNetIndex, flatNet.length, visibleLogLines]);
  const appendTextLog = (line) => {
    const newLines = splitLines(line);
    setLogTree((prev) => {
      const next = prev.concat(newLines.map((t) => ({
        id: newNodeId(),
        kind: "text",
        text: t
      })));
      if (next.length > LOG_MAX_LINES)
        return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };
  const appendEntryLog = (label, args = [], timestamp) => {
    setLogTree((prev) => {
      const next = prev.concat([
        {
          id: newNodeId(),
          kind: "entry",
          label,
          args,
          timestamp,
          expanded: false
        }
      ]);
      if (next.length > LOG_MAX_LINES)
        return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };
  const clearLogs = () => {
    setLogTree([]);
    setSelectedLogNodeId(null);
    setLogScrollTop(0);
    setFollowTail(true);
  };
  const clearNetwork = () => {
    setNetTree([]);
    netByIdRef.current.clear();
    setSelectedNetNodeId(null);
    setNetScrollTop(0);
    setFollowNetTail(true);
    setNetSearchQuery("");
  };
  const netByIdRef = useRef(new Map);
  const upsertNet = (rid, patch) => {
    const prev = netByIdRef.current.get(rid) ?? { requestId: rid };
    netByIdRef.current.set(rid, { ...prev, ...patch });
  };
  const getNetLabel = (rid) => {
    const r = netByIdRef.current.get(rid);
    const time = formatTime(r?.startTimestamp ?? Date.now());
    const method = r?.method ?? "";
    const url = r?.url ?? "";
    const status2 = typeof r?.status === "number" ? r.status : undefined;
    const tail = r?.errorText ? ` ✖ ${r.errorText}` : status2 != null ? ` ${status2}` : "";
    return `[${time}] ${method} ${url}${tail}`.trimEnd();
  };
  const setNetNode = (rid, updater) => {
    const id = `net:${rid}`;
    setNetTree((prev) => updateNodeById(prev, id, updater));
  };
  const ensureNetRequestNode = (rid) => {
    setNetTree((prev) => {
      const id = `net:${rid}`;
      if (findNodeById(prev, id)) {
        return updateNodeById(prev, id, (n) => ({
          ...n,
          label: getNetLabel(rid)
        }));
      }
      const next = prev.concat([
        {
          id,
          kind: "entry",
          label: getNetLabel(rid),
          expanded: false,
          net: { requestId: rid, role: "request" }
        }
      ]);
      const NET_MAX = 1500;
      return next.length > NET_MAX ? next.slice(next.length - NET_MAX) : next;
    });
  };
  const buildHeadersChildren = (headers) => {
    const entries = Object.entries(headers ?? {});
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const LIMIT = 120;
    const sliced = entries.slice(0, LIMIT);
    const children = sliced.map(([k, v]) => ({
      id: newNodeId(),
      kind: "text",
      text: `${k}: ${v}`
    }));
    if (entries.length > LIMIT) {
      children.push({
        id: newNodeId(),
        kind: "meta",
        text: `… (${entries.length - LIMIT} more headers)`
      });
    }
    if (children.length === 0)
      children.push({
        id: newNodeId(),
        kind: "meta",
        text: "(no headers)"
      });
    return children;
  };
  const buildNetChildren = (rid) => {
    const r = netByIdRef.current.get(rid);
    const meta = [];
    if (r?.type)
      meta.push({
        id: newNodeId(),
        kind: "text",
        text: `type: ${r.type}`
      });
    if (r?.initiator)
      meta.push({
        id: newNodeId(),
        kind: "text",
        text: `initiator: ${r.initiator}`
      });
    if (typeof r?.encodedDataLength === "number")
      meta.push({
        id: newNodeId(),
        kind: "text",
        text: `bytes: ${r.encodedDataLength}`
      });
    const reqHeadersNode = {
      id: `net:${rid}:reqHeaders`,
      kind: "entry",
      label: `Request Headers (${Object.keys(r?.requestHeaders ?? {}).length})`,
      expanded: false,
      children: buildHeadersChildren(r?.requestHeaders),
      net: { requestId: rid, role: "headers", which: "request" }
    };
    const resLineParts = [];
    if (typeof r?.status === "number")
      resLineParts.push(String(r.status));
    if (r?.statusText)
      resLineParts.push(r.statusText);
    if (r?.mimeType)
      resLineParts.push(r.mimeType);
    const resMeta = [];
    if (r?.protocol)
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `protocol: ${r.protocol}`
      });
    if (r?.remoteIPAddress) {
      const port2 = typeof r.remotePort === "number" ? `:${r.remotePort}` : "";
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `remote: ${r.remoteIPAddress}${port2}`
      });
    }
    if (r?.fromDiskCache)
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `fromDiskCache: true`
      });
    if (r?.fromServiceWorker)
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `fromServiceWorker: true`
      });
    const resHeadersNode = {
      id: `net:${rid}:resHeaders`,
      kind: "entry",
      label: `Response Headers (${Object.keys(r?.responseHeaders ?? {}).length})`,
      expanded: false,
      children: buildHeadersChildren(r?.responseHeaders),
      net: { requestId: rid, role: "headers", which: "response" }
    };
    const bodyNode = {
      id: `net:${rid}:body`,
      kind: "entry",
      label: "Response Body",
      expanded: false,
      children: [
        { id: newNodeId(), kind: "meta", text: "(press z to load)" }
      ],
      net: { requestId: rid, role: "body" }
    };
    const responseNode = {
      id: `net:${rid}:response`,
      kind: "entry",
      label: `Response${resLineParts.length ? `: ${resLineParts.join(" ")}` : ""}`,
      expanded: false,
      children: [resHeadersNode, ...resMeta, bodyNode],
      net: { requestId: rid, role: "response" }
    };
    const reqBodyNode = {
      id: `net:${rid}:reqBody`,
      kind: "entry",
      label: "Request Body",
      expanded: false,
      children: [
        { id: newNodeId(), kind: "meta", text: "(press z to view)" }
      ],
      net: { requestId: rid, role: "body", which: "request" }
    };
    const reqMeta = [];
    if (r?.postData) {
      reqMeta.push(reqBodyNode);
    }
    return [...meta, reqHeadersNode, ...reqMeta, responseNode];
  };
  const loadResponseBody = async (rid) => {
    const c = clientRef.current;
    const Network = c?.Network;
    if (!Network?.getResponseBody)
      throw new Error("Network.getResponseBody is not available (not attached?)");
    const res = await Network.getResponseBody({ requestId: rid });
    return {
      body: String(res?.body ?? ""),
      base64Encoded: Boolean(res?.base64Encoded)
    };
  };
  const ensureEntryChildren = (node) => {
    if (node.kind !== "entry")
      return node;
    if (node.children && node.children.length > 0)
      return node;
    const args = Array.isArray(node.args) ? node.args : [];
    const children = args.map((obj, i) => ({
      id: `${node.id}:arg:${i}`,
      kind: "arg",
      object: obj,
      expanded: false
    }));
    return { ...node, children };
  };
  const ensureObjectChildrenLoading = (nodeId) => {
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => {
      if (n.kind !== "arg" && n.kind !== "prop")
        return n;
      if (n.loading)
        return n;
      const obj = n.kind === "arg" ? n.object : n.value;
      if (!isObjectExpandable(obj))
        return n;
      return {
        ...n,
        loading: true,
        children: [
          {
            id: newNodeId(),
            kind: "meta",
            text: "(loading properties...)"
          }
        ]
      };
    }));
  };
  const setObjectChildren = (nodeId, children) => {
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => ({
      ...n,
      loading: false,
      children
    })));
  };
  const loadPropertiesForObjectId = async (objectId) => {
    const c = clientRef.current;
    const Runtime = c?.Runtime;
    if (!Runtime?.getProperties)
      throw new Error("Runtime.getProperties is not available (not attached?)");
    const res = await Runtime.getProperties({
      objectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: true
    });
    const list = Array.isArray(res?.result) ? res.result : [];
    const items = list.filter((p) => p && typeof p.name === "string" && p.value).map((p) => ({
      name: String(p.name),
      value: p.value,
      enumerable: Boolean(p.enumerable)
    }));
    items.sort((a, b) => Number(b.enumerable) - Number(a.enumerable) || a.name.localeCompare(b.name));
    const LIMIT = 80;
    const sliced = items.slice(0, LIMIT);
    const children = sliced.map((it) => ({
      id: newNodeId(),
      kind: "prop",
      name: it.name,
      value: it.value,
      expanded: false
    }));
    if (items.length > LIMIT) {
      children.push({
        id: newNodeId(),
        kind: "meta",
        text: `… (${items.length - LIMIT} more properties)`
      });
    }
    return children;
  };
  const toggleExpandSelected = async () => {
    if (isExpandingRef.current)
      return;
    if (!flatLogs.length)
      return;
    const nodeId = selectedLogNodeId ?? flatLogs[flatLogs.length - 1]?.nodeId;
    if (!nodeId)
      return;
    const node = findNodeById(logTree, nodeId);
    if (!node)
      return;
    const expandable = node.kind === "entry" ? Array.isArray(node.args) && node.args.length > 0 : node.kind === "arg" ? isObjectExpandable(node.object) : node.kind === "prop" ? isObjectExpandable(node.value) : false;
    if (!expandable)
      return;
    const nextExpanded = !Boolean(node.expanded);
    if (node.kind === "entry") {
      const args = Array.isArray(node.args) ? node.args : [];
      const firstArg = args[0];
      const autoExpandArg0 = nextExpanded && args.length === 1 && isObjectExpandable(firstArg);
      const arg0 = autoExpandArg0 ? firstArg : null;
      const arg0Id = autoExpandArg0 ? `${nodeId}:arg:0` : null;
      setLogTree((prev) => updateNodeById(prev, nodeId, (n) => {
        const ensured = ensureEntryChildren(n);
        if (!autoExpandArg0)
          return { ...ensured, expanded: nextExpanded };
        const children = Array.isArray(ensured.children) ? ensured.children : [];
        const first = children[0];
        const rest = children.slice(1);
        const updatedFirst = first ? {
          ...first,
          expanded: true,
          loading: true,
          children: [
            {
              id: newNodeId(),
              kind: "meta",
              text: "(loading properties...)"
            }
          ]
        } : first;
        return {
          ...ensured,
          expanded: nextExpanded,
          children: updatedFirst ? [updatedFirst, ...rest] : children
        };
      }));
      if (autoExpandArg0 && arg0 && arg0Id) {
        isExpandingRef.current = true;
        try {
          const children = await loadPropertiesForObjectId(arg0.objectId);
          setObjectChildren(arg0Id, children);
        } catch (err) {
          setObjectChildren(arg0Id, [
            {
              id: newNodeId(),
              kind: "meta",
              text: `[props] ! ${String(err)}`
            }
          ]);
        } finally {
          isExpandingRef.current = false;
        }
      }
      return;
    }
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
    if (!nextExpanded)
      return;
    const obj = node.kind === "arg" ? node.object : node.value;
    if (!isObjectExpandable(obj))
      return;
    if (Array.isArray(node.children) && node.children.length > 0 && !node.loading)
      return;
    isExpandingRef.current = true;
    try {
      ensureObjectChildrenLoading(nodeId);
      const children = await loadPropertiesForObjectId(obj.objectId);
      setObjectChildren(nodeId, children);
    } catch (err) {
      setObjectChildren(nodeId, [
        {
          id: newNodeId(),
          kind: "meta",
          text: `[props] ! ${String(err)}`
        }
      ]);
    } finally {
      isExpandingRef.current = false;
    }
  };
  const collapseSelectedRegion = () => {
    if (!flatLogs.length)
      return;
    const currentId = selectedLogNodeId ?? flatLogs[flatLogs.length - 1]?.nodeId;
    if (!currentId)
      return;
    const current = findNodeById(logTree, currentId);
    if (current?.expanded) {
      setLogTree((prev) => updateNodeById(prev, currentId, (n) => ({ ...n, expanded: false })));
      return;
    }
    const flatIndex = flatLogs.findIndex((l) => l.nodeId === currentId);
    if (flatIndex < 0)
      return;
    let parentId = flatLogs[flatIndex]?.parentId ?? null;
    while (parentId) {
      const parentNode = findNodeById(logTree, parentId);
      if (parentNode?.expanded) {
        const pid = parentId;
        setSelectedLogNodeId(pid);
        setLogTree((prev) => updateNodeById(prev, pid, (n) => ({ ...n, expanded: false })));
        return;
      }
      const parentFlatIndex = flatLogs.findIndex((l) => l.nodeId === parentId);
      parentId = parentFlatIndex >= 0 ? flatLogs[parentFlatIndex].parentId : null;
    }
  };
  const toggleNetExpandSelected = async () => {
    if (isExpandingRef.current)
      return;
    if (!flatNet.length)
      return;
    const nodeId = selectedNetNodeId ?? flatNet[flatNet.length - 1]?.nodeId;
    if (!nodeId)
      return;
    const node = findNodeById(netTree, nodeId);
    if (!node)
      return;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const expandable = node.kind === "entry" ? hasChildren || Boolean(node.net) : false;
    if (!expandable)
      return;
    const nextExpanded = !Boolean(node.expanded);
    if (node.net?.role === "request") {
      const rid = node.net.requestId;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => {
        const already = Array.isArray(n.children) && n.children.length > 0;
        const children = already ? n.children : buildNetChildren(rid);
        return { ...n, expanded: nextExpanded, children };
      }));
      return;
    }
    if (node.net?.role === "body" && node.net?.which === "request") {
      const rid = node.net.requestId;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
      if (!nextExpanded)
        return;
      const record = netByIdRef.current.get(rid);
      if (record?.postData) {
        const { lines, typeHint } = formatResponseBody(record.postData, false);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children = [
          { id: newNodeId(), kind: "meta", text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text",
            text: t
          }))
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta",
            text: `… (${lines.length - LIMIT} more lines)`
          });
        }
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, children })));
        return;
      }
      return;
    }
    if (node.net?.role === "body") {
      const rid = node.net.requestId;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
      if (!nextExpanded)
        return;
      const record = netByIdRef.current.get(rid);
      if (record?.responseBody) {
        const rb = record.responseBody;
        const { lines, typeHint } = formatResponseBody(rb.body, rb.base64Encoded);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children = [
          { id: newNodeId(), kind: "meta", text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text",
            text: t
          }))
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta",
            text: `… (${lines.length - LIMIT} more lines)`
          });
        }
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, children })));
        return;
      }
      isExpandingRef.current = true;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({
        ...n,
        loading: true,
        children: [
          {
            id: newNodeId(),
            kind: "meta",
            text: "(loading response body...)"
          }
        ]
      })));
      try {
        const body = await loadResponseBody(rid);
        upsertNet(rid, { responseBody: body });
        const { lines, typeHint } = formatResponseBody(body.body, body.base64Encoded);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children = [
          { id: newNodeId(), kind: "meta", text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text",
            text: t
          }))
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta",
            text: `… (${lines.length - LIMIT} more lines)`
          });
        }
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({
          ...n,
          loading: false,
          children
        })));
      } catch (err) {
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({
          ...n,
          loading: false,
          children: [
            {
              id: newNodeId(),
              kind: "meta",
              text: `[body] ! ${String(err)}`
            }
          ]
        })));
      } finally {
        isExpandingRef.current = false;
      }
      return;
    }
    setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
  };
  const collapseNetSelectedRegion = () => {
    if (!flatNet.length)
      return;
    const currentId = selectedNetNodeId ?? flatNet[flatNet.length - 1]?.nodeId;
    if (!currentId)
      return;
    const current = findNodeById(netTree, currentId);
    if (current?.expanded) {
      setNetTree((prev) => updateNodeById(prev, currentId, (n) => ({ ...n, expanded: false })));
      return;
    }
    const flatIndex = flatNet.findIndex((l) => l.nodeId === currentId);
    if (flatIndex < 0)
      return;
    let parentId = flatNet[flatIndex]?.parentId ?? null;
    while (parentId) {
      const parentNode = findNodeById(netTree, parentId);
      if (parentNode?.expanded) {
        const pid = parentId;
        setSelectedNetNodeId(pid);
        setNetTree((prev) => updateNodeById(prev, pid, (n) => ({ ...n, expanded: false })));
        return;
      }
      const parentFlatIndex = flatNet.findIndex((l) => l.nodeId === parentId);
      parentId = parentFlatIndex >= 0 ? flatNet[parentFlatIndex].parentId : null;
    }
  };
  const refreshTargets = async (preferIndex) => {
    setStatus(`fetching targets from ${host}:${port} ...`);
    const fetch = async (h) => {
      return await listTargets({ host: h, port });
    };
    try {
      const t = await fetch(host);
      setTargets(t);
      const prevSelectedId = selectedTargetIdRef.current;
      const prevAttachedId = attachedTargetIdRef.current;
      const selectedById = prevSelectedId != null ? t.findIndex((x) => x.id === prevSelectedId) : -1;
      const attachedById = prevAttachedId != null ? t.findIndex((x) => x.id === prevAttachedId) : -1;
      const idxRaw = selectedById >= 0 ? selectedById : typeof preferIndex === "number" ? preferIndex : selectedIndex;
      const idx = clamp(idxRaw, 0, Math.max(0, t.length - 1));
      setSelectedIndex(idx);
      setAttachedIndex(attachedById >= 0 ? attachedById : null);
      lastFetchErrorRef.current = null;
      setStatus(`targets: ${t.length}  |  ${host}:${port}`);
      return;
    } catch (err) {
      const firstErr = String(err);
      if (host === "localhost") {
        try {
          const t = await fetch("127.0.0.1");
          setHost("127.0.0.1");
          setTargets(t);
          const idx = clamp(typeof preferIndex === "number" ? preferIndex : selectedIndex, 0, Math.max(0, t.length - 1));
          setSelectedIndex(idx);
          appendTextLog("[hint] localhost failed; switched host to 127.0.0.1");
          setStatus(`targets: ${t.length}  |  127.0.0.1:${port}`);
          return;
        } catch {}
      }
      if (lastFetchErrorRef.current !== firstErr) {
        appendTextLog(firstErr);
        lastFetchErrorRef.current = firstErr;
      }
      setTargets([]);
      setStatus(`failed to fetch targets from ${host}:${port}`);
      if (!hasShownConnectHelpRef.current) {
        hasShownConnectHelpRef.current = true;
        appendTextLog([
          "[hint] Start Chrome with remote debugging enabled:",
          '  open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp',
          "[hint] Verify endpoint:",
          `  curl http://${host}:${port}/json/list`
        ].join(`
`));
      }
    }
  };
  const detach = async () => {
    const c = clientRef.current;
    clientRef.current = null;
    await safeCloseClient(c);
    setAttachedIndex(null);
    setStatus(`detached  |  ${host}:${port}`);
  };
  const submitEval = async () => {
    const expr = evalText.trim();
    setEvalText("");
    setEvalOpen(false);
    if (!expr)
      return;
    appendTextLog(`[eval] ${expr}`);
    const c = clientRef.current;
    const Runtime = c?.Runtime;
    if (!Runtime?.evaluate) {
      appendTextLog("[eval] ! not attached (select a target and press Enter)");
      return;
    }
    try {
      const res = await Runtime.evaluate({
        expression: expr,
        awaitPromise: true,
        returnByValue: false
      });
      if (res?.exceptionDetails) {
        const text = String(res.exceptionDetails.text ?? "exception");
        appendTextLog(`[eval] ! ${text}`);
        if (res.exceptionDetails.exception) {
          appendEntryLog(`eval!`, [res.exceptionDetails.exception], Date.now());
        }
        return;
      }
      appendEntryLog(`eval =>`, [res?.result], Date.now());
    } catch (err) {
      appendTextLog(`[eval] ! ${String(err)}`);
    }
  };
  const attachByIndex = async (index) => {
    if (isAttachingRef.current)
      return;
    isAttachingRef.current = true;
    try {
      const t = targets[index];
      if (!t) {
        setStatus("invalid selection");
        return;
      }
      await detach();
      const title = (t.title ?? "").trim() || "(no title)";
      setStatus(`attaching: ${title}`);
      let c;
      try {
        c = await connectToTarget(t, { host, port });
      } catch (err) {
        appendTextLog(String(err));
        setStatus(`attach failed: ${title}`);
        return;
      }
      clientRef.current = c;
      setAttachedIndex(index);
      attachedTargetIdRef.current = t.id;
      const anyClient = c;
      if (typeof anyClient.on === "function") {
        anyClient.on("disconnect", () => {
          appendTextLog("[transport] disconnected");
          setStatus("disconnected (press r to refresh targets)");
          setAttachedIndex(null);
        });
      }
      const { Runtime, Log, Network, Console } = anyClient;
      try {
        await Promise.all([
          Runtime?.enable?.(),
          Console?.enable?.(),
          Log?.enable?.(),
          Network?.enable?.()
        ]);
      } catch (err) {
        appendTextLog(`[enable] ${String(err)}`);
      }
      Runtime?.consoleAPICalled?.((p) => {
        const time = formatTime(p?.timestamp ?? Date.now());
        const type = String(p?.type ?? "log");
        const args = Array.isArray(p?.args) ? p.args : [];
        appendEntryLog(`[${time}] console.${type}`, args, p?.timestamp);
      });
      Runtime?.exceptionThrown?.((p) => {
        const time = formatTime(p?.timestamp ?? Date.now());
        const details = p?.exceptionDetails;
        const text = details?.text ? String(details.text) : "exception";
        const args = details?.exception ? [details.exception] : [];
        appendEntryLog(`[${time}] exception ${text}`.trimEnd(), args, p?.timestamp);
      });
      Console?.messageAdded?.((p) => {
        const msg = p?.message ?? p;
        const source = typeof msg?.source === "string" ? String(msg.source) : "";
        if (source === "console-api")
          return;
        const time = formatTime(msg?.timestamp ?? Date.now());
        const level = String(msg?.level ?? "log");
        const text = String(msg?.text ?? "");
        const params = Array.isArray(msg?.parameters) ? msg.parameters : [];
        appendEntryLog(`[${time}] console.${level} ${text}`.trimEnd(), params, msg?.timestamp);
      });
      Log?.entryAdded?.((p) => {
        const entry = p?.entry ?? p;
        const time = formatTime(entry?.timestamp ?? Date.now());
        const level = String(entry?.level ?? "info");
        const text = String(entry?.text ?? "");
        const url = entry?.url ? ` (${entry.url})` : "";
        appendTextLog(`[${time}] log.${level} ${text}${url}`.trimEnd());
      });
      Network?.requestWillBeSent?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        const req = p?.request;
        const url = String(req?.url ?? "");
        const method = String(req?.method ?? "");
        const headers = req?.headers ?? {};
        const postData = typeof req?.postData === "string" ? req.postData : undefined;
        const initiatorUrl = p?.initiator?.url ? String(p.initiator.url) : undefined;
        upsertNet(rid, {
          startTimestamp: p?.timestamp,
          method,
          url,
          requestHeaders: headers,
          postData,
          initiator: initiatorUrl,
          type: p?.type ? String(p.type) : undefined
        });
        ensureNetRequestNode(rid);
      });
      Network?.responseReceived?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        const res = p?.response;
        const headers = res?.headers ?? {};
        upsertNet(rid, {
          status: typeof res?.status === "number" ? res.status : undefined,
          statusText: typeof res?.statusText === "string" ? res.statusText : undefined,
          mimeType: typeof res?.mimeType === "string" ? res.mimeType : undefined,
          protocol: typeof res?.protocol === "string" ? res.protocol : undefined,
          remoteIPAddress: typeof res?.remoteIPAddress === "string" ? res.remoteIPAddress : undefined,
          remotePort: typeof res?.remotePort === "number" ? res.remotePort : undefined,
          fromDiskCache: Boolean(res?.fromDiskCache),
          fromServiceWorker: Boolean(res?.fromServiceWorker),
          responseHeaders: headers
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => {
          const children = Array.isArray(n.children) && n.children.length > 0 ? buildNetChildren(rid) : n.children;
          return { ...n, label: getNetLabel(rid), children };
        });
      });
      Network?.loadingFinished?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        upsertNet(rid, {
          endTimestamp: p?.timestamp,
          encodedDataLength: typeof p?.encodedDataLength === "number" ? p.encodedDataLength : undefined
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => ({ ...n, label: getNetLabel(rid) }));
      });
      Network?.loadingFailed?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        upsertNet(rid, {
          endTimestamp: p?.timestamp,
          errorText: typeof p?.errorText === "string" ? p.errorText : "failed",
          canceled: Boolean(p?.canceled)
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => ({ ...n, label: getNetLabel(rid) }));
      });
      if (opts.network) {
        Network?.webSocketFrameSent?.((p) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(`[${time}] ws.sent ${truncate(payload, 200)}`.trimEnd());
        });
        Network?.webSocketFrameReceived?.((p) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(`[${time}] ws.recv ${truncate(payload, 200)}`.trimEnd());
        });
      }
      appendTextLog(`[attached] ${title}`);
      setStatus(`attached: ${title}  |  ${host}:${port}`);
      setFocus("right");
      setRightTab("logs");
      try {
        await Runtime?.evaluate?.({
          expression: `console.log("[termdev] attached", new Date().toISOString())`
        });
      } catch {}
    } finally {
      isAttachingRef.current = false;
    }
  };
  useEffect(() => {
    refreshTargets();
  }, []);
  useEffect(() => {
    if (!opts.pollMs || opts.pollMs <= 0)
      return;
    const id = setInterval(() => {
      refreshTargets();
    }, opts.pollMs);
    return () => clearInterval(id);
  }, [opts.pollMs, host, port]);
  useEffect(() => {
    if (!opts.targetQuery)
      return;
    if (!targets.length)
      return;
    const picked = pickTargetByQuery(targets, opts.targetQuery);
    if (picked.target && picked.index >= 0) {
      setSelectedIndex(picked.index);
      attachByIndex(picked.index);
    } else {
      appendTextLog(`[auto-attach] no match for: ${opts.targetQuery}`);
    }
  }, [targets.length]);
  useEffect(() => {
    return () => {
      detach();
    };
  }, []);
  useInput((input, key) => {
    if (evalOpen) {
      if (key.escape) {
        setEvalOpen(false);
        setEvalText("");
        return;
      }
      if (key.return) {
        submitEval();
        return;
      }
      if (key.ctrl && input === "c") {
        exit();
        return;
      }
      return;
    }
    if (netSearchOpen) {
      if (key.escape) {
        setNetSearchOpen(false);
        return;
      }
      if (key.return) {
        setNetSearchOpen(false);
        return;
      }
      if (key.ctrl && input === "u") {
        setNetSearchQuery("");
        return;
      }
      if (key.ctrl && input === "c") {
        exit();
        return;
      }
      return;
    }
    if (key.tab) {
      setFocus((f) => f === "targets" ? "right" : "targets");
      return;
    }
    if (input === "q" || key.escape) {
      exit();
      return;
    }
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (input === "r") {
      refreshTargets();
      return;
    }
    if (input === ":") {
      setEvalOpen(true);
      setEvalText("");
      return;
    }
    if (focus === "targets") {
      if (key.upArrow || input === "k") {
        setSelectedIndex((i) => clamp(i - 1, 0, Math.max(0, targets.length - 1)));
        return;
      }
      if (key.downArrow || input === "j") {
        setSelectedIndex((i) => clamp(i + 1, 0, Math.max(0, targets.length - 1)));
        return;
      }
      if (key.return) {
        attachByIndex(selectedIndex);
        return;
      }
    } else {
      if (input === "l") {
        setRightTab("logs");
        return;
      }
      if (input === "n") {
        setRightTab("network");
        return;
      }
      if (input === "[") {
        setRightTab((t) => t === "logs" ? "network" : "logs");
        return;
      }
      if (input === "]") {
        setRightTab((t) => t === "logs" ? "network" : "logs");
        return;
      }
      const activeFlat2 = rightTab === "logs" ? flatLogs : flatNet;
      const activeIndex = rightTab === "logs" ? selectedLogIndex : selectedNetIndex;
      const setActiveSelected = (id) => {
        if (rightTab === "logs")
          setSelectedLogNodeId(id);
        else
          setSelectedNetNodeId(id);
      };
      const setActiveFollow = (v) => {
        if (rightTab === "logs")
          setFollowTail(v);
        else
          setFollowNetTail(v);
      };
      if (key.upArrow || input === "k") {
        if (!activeFlat2.length)
          return;
        setActiveFollow(false);
        const nextIdx = clamp(activeIndex - 1, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.downArrow || input === "j") {
        if (!activeFlat2.length)
          return;
        const nextIdx = clamp(activeIndex + 1, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        if (nextIdx === activeFlat2.length - 1)
          setActiveFollow(true);
        else
          setActiveFollow(false);
        return;
      }
      if (key.pageUp || key.ctrl && input === "u") {
        if (!activeFlat2.length)
          return;
        setActiveFollow(false);
        const nextIdx = clamp(activeIndex - visibleLogLines, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.pageDown || key.ctrl && input === "d") {
        if (!activeFlat2.length)
          return;
        const nextIdx = clamp(activeIndex + visibleLogLines, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        if (nextIdx === activeFlat2.length - 1)
          setActiveFollow(true);
        else
          setActiveFollow(false);
        return;
      }
      if (input === "z") {
        if (rightTab === "logs")
          toggleExpandSelected();
        else
          toggleNetExpandSelected();
        return;
      }
      if (input === "Z") {
        if (rightTab === "logs")
          collapseSelectedRegion();
        else
          collapseNetSelectedRegion();
        return;
      }
      if (input === "y") {
        if (!activeFlat2.length)
          return;
        const nodeId = (rightTab === "logs" ? selectedLogNodeId : selectedNetNodeId) ?? activeFlat2[activeFlat2.length - 1]?.nodeId;
        if (!nodeId)
          return;
        const root = rightTab === "logs" ? findNodeById(logTree, nodeId) : findNodeById(netTree, nodeId);
        if (!root)
          return;
        const text = root.net?.role === "body" ? serializeBodyOnly(root).join(`
`) : serializeNodeDeep(root, 0).join(`
`);
        (async () => {
          const ok = await copyToClipboard(text);
          setStatus(ok ? "copied" : "copy failed (no clipboard tool)");
        })();
        return;
      }
      if (rightTab === "network" && input === "/") {
        setNetSearchOpen(true);
        setFollowNetTail(false);
        return;
      }
    }
    if (input === "d") {
      detach();
      return;
    }
    if (input === "p") {
      const c = clientRef.current;
      c?.Runtime?.evaluate?.({
        expression: `console.log("[termdev] ping", new Date().toISOString())`
      });
      return;
    }
    if (input === "c") {
      if (focus === "right" && rightTab === "network") {
        clearNetwork();
        setStatus("network cleared");
      } else {
        clearLogs();
        setStatus("logs cleared");
      }
      return;
    }
    if (input === "f") {
      if (focus === "right") {
        if (rightTab === "logs")
          setFollowTail(true);
        else
          setFollowNetTail(true);
      } else {
        setFollowTail(true);
      }
      return;
    }
    if (input === "?") {
      appendTextLog("Keys: tab focus | q/esc quit | r refresh | targets: ↑↓/j k + enter attach | right: l logs / n network / [ ] switch | j/k select | z toggle | Z collapse | y copy | : eval | d detach | p ping | c clear(logs/network) | f follow");
    }
  });
  useEffect(() => {
    setTargetScrollTop((top) => {
      const maxTop = Math.max(0, targets.length - visibleTargetItems);
      const curTop = clamp(top, 0, maxTop);
      if (selectedIndex < curTop)
        return selectedIndex;
      if (selectedIndex >= curTop + visibleTargetItems)
        return selectedIndex - visibleTargetItems + 1;
      return curTop;
    });
  }, [selectedIndex, targets.length, visibleTargetItems]);
  useEffect(() => {
    setSelectedIndex((i) => clamp(i, 0, Math.max(0, targets.length - 1)));
  }, [targets.length]);
  const attachedTitle = useMemo(() => {
    if (attachedIndex == null)
      return null;
    const t = targets[attachedIndex];
    if (!t)
      return "(attached)";
    return (t.title ?? "").trim() || t.url || "(attached)";
  }, [targets, attachedIndex]);
  const headerLeft = `termdev`;
  const headerRight = `${host}:${port}  •  targets:${targets.length}${attachedTitle ? `  •  attached:${attachedTitle}` : ""}`;
  const targetsViewport = useMemo(() => {
    if (!targets.length)
      return [];
    const slice = targets.slice(targetScrollTop, targetScrollTop + visibleTargetItems);
    return slice.map((t, offset) => {
      const idx = targetScrollTop + offset;
      const selected = idx === selectedIndex;
      const attached = idx === attachedIndex;
      const title = (t.title ?? "").trim() || "(no title)";
      const url = (t.url ?? "").trim();
      const type = (t.type ?? "").trim();
      const line1Prefix = `${attached ? "●" : " "} ${String(idx).padStart(2, " ")}`;
      const line1 = `${line1Prefix} ${title}`;
      const meta = [type ? `type=${type}` : "", url].filter(Boolean).join("  ");
      const line2 = `    ${meta}`;
      const maxWidth = Math.max(10, Math.floor(columns * 0.33) - 6);
      return {
        key: t.id,
        lines: [truncate(line1, maxWidth), truncate(line2, maxWidth)],
        selected,
        attached
      };
    });
  }, [
    targets,
    targetScrollTop,
    visibleTargetItems,
    selectedIndex,
    attachedIndex,
    columns
  ]);
  const activeFlat = rightTab === "logs" ? flatLogs : flatNet;
  const activeScrollTop = rightTab === "logs" ? logScrollTop : netScrollTop;
  const activeSelectedId = rightTab === "logs" ? selectedLogNodeId : selectedNetNodeId;
  const activeFollow = rightTab === "logs" ? followTail : followNetTail;
  const viewport = useMemo(() => {
    if (!activeFlat.length)
      return { start: 0, endExclusive: 0, lines: [] };
    const start = clamp(activeScrollTop, 0, Math.max(0, activeFlat.length - visibleLogLines));
    const endExclusive = clamp(start + visibleLogLines, 0, activeFlat.length);
    return {
      start,
      endExclusive,
      lines: activeFlat.slice(start, endExclusive)
    };
  }, [activeFlat, activeScrollTop, visibleLogLines]);
  const footer = `${status}   |   tab focus(${focus})  ${focus === "right" ? `rightTab=${rightTab}  ` : ""}j/k select  z toggle  Z collapse  y copy  c clear  ${rightTab === "network" ? "/ search" : ": eval"}  q quit`;
  return /* @__PURE__ */ jsxDEV(Box, {
    flexDirection: "column",
    width: "100%",
    children: [
      /* @__PURE__ */ jsxDEV(Box, {
        height: HEADER_HEIGHT,
        children: [
          /* @__PURE__ */ jsxDEV(Text, {
            color: "cyan",
            bold: true,
            children: truncate(headerLeft, Math.max(10, columns))
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            children: " "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            dimColor: true,
            children: truncate(headerRight, Math.max(10, columns - headerLeft.length - 1))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Box, {
        flexGrow: 1,
        height: mainHeight,
        children: [
          /* @__PURE__ */ jsxDEV(Box, {
            flexDirection: "column",
            width: "33%",
            borderStyle: "round",
            borderColor: focus === "targets" ? "green" : "cyan",
            paddingX: 1,
            paddingY: 0,
            marginRight: 1,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                bold: true,
                children: [
                  "Targets",
                  focus === "targets" ? " *" : "",
                  " ",
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: "(↑↓/j k, Enter)"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              targets.length === 0 ? /* @__PURE__ */ jsxDEV(Text, {
                dimColor: true,
                children: [
                  "(no targets)",
                  lastFetchErrorRef.current ? "" : `
Press r to refresh`
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV(Box, {
                flexDirection: "column",
                children: [
                  targetsViewport.map((item) => /* @__PURE__ */ jsxDEV(Box, {
                    flexDirection: "column",
                    children: [
                      /* @__PURE__ */ jsxDEV(Text, {
                        color: item.selected ? "green" : undefined,
                        bold: item.selected,
                        children: item.lines[0]
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV(Text, {
                        dimColor: true,
                        children: item.lines[1]
                      }, undefined, false, undefined, this)
                    ]
                  }, item.key, true, undefined, this)),
                  targets.length > visibleTargetItems ? /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: [
                      "(",
                      targetScrollTop + 1,
                      "-",
                      Math.min(targetScrollTop + visibleTargetItems, targets.length),
                      "/",
                      targets.length,
                      ")"
                    ]
                  }, undefined, true, undefined, this) : null
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Box, {
            flexDirection: "column",
            width: "67%",
            borderStyle: "round",
            borderColor: focus === "right" ? "green" : "cyan",
            paddingX: 1,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                bold: true,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: rightTab === "logs" ? "cyan" : "gray",
                    bold: rightTab === "logs",
                    children: "Logs"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: " "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: rightTab === "network" ? "cyan" : "gray",
                    bold: rightTab === "network",
                    children: "Network"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: [
                      "  ",
                      "(",
                      viewport.start + 1,
                      "-",
                      viewport.endExclusive,
                      "/",
                      activeFlat.length,
                      ") ",
                      activeFollow ? "• follow" : "• paused"
                    ]
                  }, undefined, true, undefined, this),
                  focus === "right" ? /* @__PURE__ */ jsxDEV(Text, {
                    color: "green",
                    children: " *focus"
                  }, undefined, false, undefined, this) : null
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV(Box, {
                flexDirection: "column",
                children: viewport.lines.map((line, i) => {
                  const idx = viewport.start + i;
                  const isSelected = focus === "right" && activeFlat[idx]?.nodeId === activeSelectedId;
                  const icon = line.expandable ? line.expanded ? "▾" : "▸" : " ";
                  const prefix = `${" ".repeat(line.indent * 2)}${icon} `;
                  const rendered = `${prefix}${line.text}`;
                  const style = classifyLogLine(line.text);
                  return /* @__PURE__ */ jsxDEV(Text, {
                    inverse: isSelected,
                    color: style.color,
                    dimColor: style.dim || !isSelected && focus !== "right",
                    children: truncate(rendered, Math.max(10, Math.floor(columns * 0.67) - 6))
                  }, line.nodeId, false, undefined, this);
                })
              }, undefined, false, undefined, this),
              evalOpen ? /* @__PURE__ */ jsxDEV(Box, {
                marginTop: 0,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "green",
                    bold: true,
                    children: [
                      "js›",
                      " "
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(TextInput, {
                    value: evalText,
                    onChange: setEvalText
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: " (Enter run, Esc cancel)"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this) : netSearchOpen ? /* @__PURE__ */ jsxDEV(Box, {
                marginTop: 0,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "cyan",
                    bold: true,
                    children: [
                      "/",
                      " "
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(TextInput, {
                    value: netSearchQuery,
                    onChange: setNetSearchQuery
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: " (Enter done, Esc close, Ctrl+U clear)"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV(Text, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    bold: true,
                    children: "Right:"
                  }, undefined, false, undefined, this),
                  " l logs / n network / [ ] switch • j/k select • z toggle • Z collapse •",
                  " ",
                  rightTab === "network" ? "/ search" : ": eval"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        inverse: true,
        children: truncate(footer, Math.max(10, columns))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
async function runTui(opts) {
  const instance = render(/* @__PURE__ */ jsxDEV(App, {
    opts: {
      host: opts.host,
      port: opts.port,
      network: opts.network,
      pollMs: opts.pollMs,
      targetQuery: opts.targetQuery
    }
  }, undefined, false, undefined, this));
  await instance.waitUntilExit();
}

// src/main.ts
async function run(argv) {
  let opts;
  try {
    opts = parseCli(argv);
  } catch (err) {
    console.error(String(err));
    console.log(HELP_TEXT);
    return;
  }
  if (opts.help) {
    console.log(HELP_TEXT);
    return;
  }
  await runTui(opts);
}

// bin/termdev.ts
var argv = typeof Bun !== "undefined" ? Bun.argv : process.argv;
await run(argv.slice(2));

//# debugId=3F5367F8DEA070E564756E2164756E21
