import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, render, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import gradient from "gradient-string";
import type { Client } from "chrome-remote-interface";

import { connectToTarget, listTargets, safeCloseClient } from "./cdp.ts";
import { formatRemoteObject, formatTime } from "./format.ts";
import { pickTargetByQuery } from "./targets.ts";
import type { CdpTarget } from "./types.ts";
import type { CliOptions } from "./cli.ts";

type RuntimeOptions = {
  host: string;
  port: number;
  network: boolean;
  pollMs: number;
  targetQuery?: string;
};

type AppProps = {
  opts: RuntimeOptions;
};

const LOG_MAX_LINES = 5000;

// ═══════════════════════════════════════════════════════════════════════════
// Nerd Font Icons (requires a Nerd Font patched terminal font)
// ═══════════════════════════════════════════════════════════════════════════
const ICONS = {
  // UI Elements
  logo: "\ueb8e", // nf-cod-terminal
  connected: "\uea71", // nf-cod-circle_filled
  disconnected: "\uea72", // nf-cod-circle_outline
  bullet: "\ueab6", // nf-cod-chevron_right
  expand: "\ueab4", // nf-cod-chevron_down
  collapse: "\ueab6", // nf-cod-chevron_right
  star: "\ueb59", // nf-cod-star_full

  // Targets
  page: "\ueb01", // nf-cod-globe
  file: "\ueaf4", // nf-cod-file
  gear: "\ueb51", // nf-cod-settings_gear (gear)
  window: "\ueb14", // nf-cod-window
  mobile: "\uea8a", // nf-cod-device_mobile
  worker: "\ueb36", // nf-cod-person
  link: "\ueb15", // nf-cod-link
  plug: "\ueb39", // nf-cod-plug

  // Actions
  search: "\uea6d", // nf-cod-search
  zap: "\ueb6c", // nf-cod-zap
  list: "\ueb85", // nf-cod-list_flat
  network: "\uf484", // nf-md-web

  // Status
  check: "\ueab2", // nf-cod-check
  error: "\ueae2", // nf-cod-error
  warning: "\uea6c", // nf-cod-warning
  info: "\uea74", // nf-cod-info
} as const;

// ASCII Art Logo with rainbow gradient
const LOGO_ART = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║ 
║   ████████╗███████╗██████╗ ███╗   ███╗██████╗ ███████╗██╗   ██╗   ║
║   ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔══██╗██╔════╝██║   ██║   ║
║      ██║   █████╗  ██████╔╝██╔████╔██║██║  ██║█████╗  ██║   ██║   ║
║      ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║  ██║██╔══╝  ╚██╗ ██╔╝   ║
║      ██║   ███████╗██║  ██║██║ ╚═╝ ██║██████╔╝███████╗ ╚████╔╝    ║
║      ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚══════╝  ╚═══╝     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`;

const LOGO_SUBTITLE = " Terminal DevTools for Chrome DevTools Protocol";
const LOGO_HINT = " Press any key to continue...";

// Rainbow gradient for logo
const rainbowGradient = gradient([
  "#FF6B6B",
  "#FFE66D",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#DDA0DD",
  "#FF6B6B",
]);

// Header gradient (cyberpunk style)
const headerGradient = gradient(["#00D9FF", "#00FF94", "#FFE600"]);

// Target type icons (Nerd Font)
const TARGET_ICONS: Record<string, string> = {
  page: ICONS.page,
  background_page: ICONS.file,
  service_worker: ICONS.gear,
  iframe: ICONS.window,
  webview: ICONS.mobile,
  worker: ICONS.worker,
  shared_worker: ICONS.link,
  other: ICONS.plug,
};

const getTargetIcon = (type: string): string => {
  return TARGET_ICONS[type] ?? TARGET_ICONS.other ?? ICONS.plug;
};

const getTargetColor = (
  type: string,
  selected: boolean,
  attached: boolean,
): string | undefined => {
  if (attached) return "green";
  if (selected) return "cyan";
  switch (type) {
    case "page":
      return "white";
    case "service_worker":
      return "yellow";
    case "background_page":
      return "magenta";
    case "iframe":
      return "blue";
    default:
      return undefined;
  }
};

// HTTP status code colors
const getStatusColor = (status: number | undefined): string => {
  if (!status) return "gray";
  if (status >= 200 && status < 300) return "green";
  if (status >= 300 && status < 400) return "cyan";
  if (status >= 400 && status < 500) return "yellow";
  if (status >= 500) return "red";
  return "white";
};

// Logo component
function LogoScreen({ onDismiss }: { onDismiss: () => void }) {
  useInput(() => {
    onDismiss();
  });

  const logoLines = LOGO_ART.trim().split("\n");
  const colors = [
    "#FF6B6B",
    "#FFE66D",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#DDA0DD",
  ];

  const coloredLines = logoLines.map((line, i) => {
    // Apply different gradient colors to each line for rainbow effect
    const c1 = colors[i % colors.length]!;
    const c2 = colors[(i + 1) % colors.length]!;
    const c3 = colors[(i + 2) % colors.length]!;
    const lineGradient = gradient([c1, c2, c3]);
    return lineGradient(line);
  });

  const subtitleColored = gradient(["#4ECDC4", "#45B7D1", "#96CEB4"])(
    LOGO_SUBTITLE,
  );
  const hintColored = gradient(["#888888", "#aaaaaa", "#888888"])(LOGO_HINT);

  return (
    <Box
      flexDirection="column"
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      {/* Logo lines */}
      {coloredLines.map((line, i) => (
        <Text key={`logo-${i}`}>{line}</Text>
      ))}

      {/* Subtitle */}
      <Text> </Text>
      <Text>{subtitleColored}</Text>

      {/* Hint */}
      <Text> </Text>
      <Text>{hintColored}</Text>
    </Box>
  );
}

const HEADER_HEIGHT = 1;
const FOOTER_HEIGHT = 1;
const MIN_ROWS = 12;
const TARGET_LINES_PER_ITEM = 2;

type Focus = "targets" | "right";

type RightTab = "logs" | "network";

type RemoteObject = {
  type?: string;
  subtype?: string;
  className?: string;
  description?: string;
  unserializableValue?: string;
  value?: any;
  objectId?: string;
  preview?: any;
};

type LogNodeKind = "text" | "entry" | "arg" | "prop" | "meta";

type LogNode = {
  id: string;
  kind: LogNodeKind;
  timestamp?: number;
  label?: string;
  text?: string;
  args?: RemoteObject[];
  object?: RemoteObject;
  name?: string;
  value?: RemoteObject;
  expanded?: boolean;
  loading?: boolean;
  children?: LogNode[];

  net?: {
    requestId: string;
    role: "request" | "headers" | "response" | "body";
    which?: "request" | "response";
  };
};

type FlatLogLine = {
  nodeId: string;
  parentId: string | null;
  indent: number;
  text: string;
  expandable: boolean;
  expanded: boolean;
};

function splitLines(s: string): string[] {
  return String(s).split("\n");
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function useTerminalSizeFallback(): { rows: number; columns: number } {
  const { stdout } = useStdout();
  const rows = (stdout as any)?.rows;
  const columns = (stdout as any)?.columns;
  return {
    rows: typeof rows === "number" && rows > 0 ? rows : 30,
    columns: typeof columns === "number" && columns > 0 ? columns : 100,
  };
}

function truncate(s: string, max: number): string {
  if (max <= 0) return "";
  if (s.length <= max) return s;
  if (max === 1) return "…";
  return `${s.slice(0, max - 1)}…`;
}

function tryPrettifyJson(body: string): { formatted: string; isJson: boolean } {
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

function formatResponseBody(
  body: string,
  base64Encoded: boolean,
): { lines: string[]; typeHint: string } {
  if (base64Encoded) {
    // For base64 data, show first few chars
    const preview = body.length > 100 ? body.slice(0, 100) + "..." : body;
    return { lines: [preview], typeHint: "(base64 encoded)" };
  }

  const { formatted, isJson } = tryPrettifyJson(body);
  const lines = splitLines(formatted);
  const typeHint = isJson ? "(json, formatted)" : "(text)";
  return { lines, typeHint };
}

function classifyLogLine(line: string): { color?: string; dim?: boolean } {
  const l = line.toLowerCase();
  if (
    l.includes("exception") ||
    l.includes("console.error") ||
    l.includes("log.error")
  )
    return { color: "red" };
  if (
    l.includes("warn") ||
    l.includes("warning") ||
    l.includes("console.warn") ||
    l.includes("log.warning")
  ) {
    return { color: "yellow" };
  }
  if (l.startsWith("[eval]")) return { color: "green" };
  if (l.startsWith("eval>") || l.startsWith("[eval]"))
    return { color: "green" };
  if (l.includes("[props]")) return { color: "cyan" };
  if (l.includes("net.request")) return { color: "cyan", dim: true };
  if (l.includes("net.response")) return { color: "cyan", dim: true };
  if (l.startsWith("[hint]")) return { color: "magenta" };
  if (l.startsWith("[attached]") || l.startsWith("[transport]"))
    return { color: "green" };
  // JSON-like lines: keys in quotes followed by colon
  const trimmed = line.trimStart();
  if (/^"[^"]+"\s*:/.test(trimmed)) return { color: "cyan" };
  // JSON values: null, true, false, numbers
  if (/^\s*(null|true|false|-?\d+\.?\d*)\s*,?\s*$/.test(trimmed))
    return { color: "yellow" };
  return { dim: false };
}

function isObjectExpandable(
  obj: RemoteObject | undefined,
): obj is RemoteObject & { objectId: string } {
  return Boolean(
    obj &&
      typeof obj === "object" &&
      typeof (obj as any).objectId === "string" &&
      (obj as any).objectId.length > 0,
  );
}

function flattenLogTree(
  nodes: LogNode[],
  parentId: string | null = null,
  indent = 0,
): FlatLogLine[] {
  const out: FlatLogLine[] = [];
  for (const n of nodes) {
    const expandable =
      n.kind === "entry"
        ? (Array.isArray(n.args) && n.args.length > 0) ||
          (Array.isArray(n.children) && n.children.length > 0) ||
          Boolean(n.loading)
        : n.kind === "arg"
          ? isObjectExpandable(n.object)
          : n.kind === "prop"
            ? isObjectExpandable(n.value)
            : false;

    const expanded = Boolean(n.expanded);

    const text = (() => {
      if (n.kind === "text") return n.text ?? "";
      if (n.kind === "meta") return n.text ?? "";

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

function updateNodeById(
  nodes: LogNode[],
  id: string,
  updater: (n: LogNode) => LogNode,
): LogNode[] {
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

function findNodeById(nodes: LogNode[], id: string): LogNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function serializeNodeDeep(node: LogNode, indent = 0): string[] {
  const pad = "  ".repeat(indent);
  const line = (() => {
    if (node.kind === "text" || node.kind === "meta")
      return `${pad}${node.text ?? ""}`.trimEnd();
    if (node.kind === "entry") {
      const label = node.label ?? "";
      const args = Array.isArray(node.args) ? node.args : [];
      const preview = args.map(formatRemoteObject).join(" ");
      return `${pad}${
        preview ? `${label} ${preview}`.trimEnd() : label
      }`.trimEnd();
    }
    if (node.kind === "arg") {
      return `${pad}${
        node.object ? formatRemoteObject(node.object) : ""
      }`.trimEnd();
    }
    if (node.kind === "prop") {
      const name = node.name ?? "?";
      return `${pad}${name}: ${
        node.value ? formatRemoteObject(node.value) : "undefined"
      }`.trimEnd();
    }
    return `${pad}${node.text ?? ""}`.trimEnd();
  })();

  const out = [line];
  const children = Array.isArray(node.children) ? node.children : [];
  for (const c of children) out.push(...serializeNodeDeep(c, indent + 1));
  return out;
}

function serializeBodyOnly(node: LogNode): string[] {
  // For network body nodes, only copy the actual body content, skip meta comments
  if (node.kind === "meta") {
    return []; // Skip meta nodes (comments)
  }
  if (node.kind === "text") {
    return [node.text ?? ""];
  }
  if (node.kind === "entry" && node.net?.role === "body") {
    // For body nodes, only serialize children (the actual body content)
    const children = Array.isArray(node.children) ? node.children : [];
    const out: string[] = [];
    for (const c of children) {
      out.push(...serializeBodyOnly(c));
    }
    return out;
  }
  // For other nodes, use normal serialization
  const children = Array.isArray(node.children) ? node.children : [];
  const out: string[] = [];
  for (const c of children) {
    out.push(...serializeBodyOnly(c));
  }
  return out;
}

async function copyToClipboard(text: string): Promise<boolean> {
  const trimmed = text.replace(/\s+$/g, "") + "\n";
  try {
    // Use dynamic import to support both Bun and Node.js
    const { spawn } = await import("child_process");
    type ChildProcess = Awaited<ReturnType<typeof spawn>>;

    // Helper to run clipboard command
    const runClipboard = (args: string[]): Promise<boolean> => {
      return new Promise((resolve) => {
        const cmd = args[0];
        if (!cmd) {
          resolve(false);
          return;
        }

        const proc = spawn(cmd, args.slice(1), {
          stdio: ["pipe", "ignore", "ignore"],
        }) as ChildProcess & { stdin: NodeJS.WritableStream };

        if (proc.stdin) {
          proc.stdin.write(trimmed);
          proc.stdin.end();
        }

        proc.on("close", (code: number | null) => {
          resolve(code === 0);
        });

        proc.on("error", () => {
          resolve(false);
        });
      });
    };

    // Try commands in order, first successful one wins
    // macOS
    if (process.platform === "darwin") {
      const result = await runClipboard(["pbcopy"]);
      if (result) return true;
    }
    // Linux (best-effort)
    const wlResult = await runClipboard(["wl-copy"]);
    if (wlResult) return true;

    const xclipResult = await runClipboard([
      "xclip",
      "-selection",
      "clipboard",
    ]);
    if (xclipResult) return true;
  } catch {
    // ignore
  }
  return false;
}

function App({ opts }: AppProps) {
  const { exit } = useApp();
  const { rows, columns } = useTerminalSizeFallback();
  const safeRows = Math.max(MIN_ROWS, rows);

  // Logo screen state
  const [showLogo, setShowLogo] = useState(true);

  const [host, setHost] = useState(opts.host);
  const [port] = useState(opts.port);
  const [targets, setTargets] = useState<CdpTarget[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attachedIndex, setAttachedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string>(
    `connecting to ${opts.host}:${opts.port}...`,
  );

  const [focus, setFocus] = useState<Focus>("targets");
  const [rightTab, setRightTab] = useState<RightTab>("logs");

  const [logTree, setLogTree] = useState<LogNode[]>([]);
  const [followTail, setFollowTail] = useState(true);
  const [logScrollTop, setLogScrollTop] = useState(0);
  const [selectedLogNodeId, setSelectedLogNodeId] = useState<string | null>(
    null,
  );

  const [netTree, setNetTree] = useState<LogNode[]>([]);
  const [followNetTail, setFollowNetTail] = useState(true);
  const [netScrollTop, setNetScrollTop] = useState(0);
  const [selectedNetNodeId, setSelectedNetNodeId] = useState<string | null>(
    null,
  );

  const [netSearchOpen, setNetSearchOpen] = useState(false);
  const [netSearchQuery, setNetSearchQuery] = useState("");

  const [logSearchOpen, setLogSearchOpen] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const [targetScrollTop, setTargetScrollTop] = useState(0);

  const [evalOpen, setEvalOpen] = useState(false);
  const [evalText, setEvalText] = useState("");

  const clientRef = useRef<Client | null>(null);
  const hasShownConnectHelpRef = useRef(false);
  const isAttachingRef = useRef(false);
  const lastFetchErrorRef = useRef<string | null>(null);
  const isExpandingRef = useRef(false);
  const selectedTargetIdRef = useRef<string | null>(null);
  const attachedTargetIdRef = useRef<string | null>(null);
  const nextNodeIdRef = useRef(0);

  const newNodeId = () => `n${++nextNodeIdRef.current}`;

  useEffect(() => {
    selectedTargetIdRef.current = targets[selectedIndex]?.id ?? null;
  }, [targets, selectedIndex]);

  useEffect(() => {
    attachedTargetIdRef.current =
      attachedIndex == null ? null : (targets[attachedIndex]?.id ?? null);
  }, [targets, attachedIndex]);

  const mainHeight = Math.max(1, safeRows - HEADER_HEIGHT - FOOTER_HEIGHT);
  const panelInnerHeight = Math.max(3, mainHeight - 2); // subtract border
  const rightReserved = evalOpen || netSearchOpen || logSearchOpen ? 2 : 1;
  const visibleLogLines = Math.max(3, panelInnerHeight - 1 - rightReserved); // subtract title line + input
  const visibleTargetItems = Math.max(
    1,
    Math.floor((panelInnerHeight - 1) / TARGET_LINES_PER_ITEM),
  );

  const filteredLogTree = useMemo(() => {
    const q = logSearchQuery.trim().toLowerCase();
    if (!q) return logTree;

    return logTree.filter((n) => {
      const hay = `${n.label ?? ""} ${n.text ?? ""}`.toLowerCase();
      // Also check args preview for console entries
      if (n.kind === "entry" && Array.isArray(n.args)) {
        const argsPreview = n.args
          .map(formatRemoteObject)
          .join(" ")
          .toLowerCase();
        if (argsPreview.includes(q)) return true;
      }
      return hay.includes(q);
    });
  }, [logTree, logSearchQuery]);

  const flatLogs = useMemo(
    () => flattenLogTree(filteredLogTree),
    [filteredLogTree],
  );

  const filteredNetTree = useMemo(() => {
    const q = netSearchQuery.trim().toLowerCase();
    if (!q) return netTree;

    return netTree.filter((n) => {
      const hay = `${n.label ?? ""} ${n.text ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [netTree, netSearchQuery]);

  const flatNet = useMemo(
    () => flattenLogTree(filteredNetTree),
    [filteredNetTree],
  );

  const selectedLogIndex = useMemo(() => {
    if (!flatLogs.length) return -1;
    if (!selectedLogNodeId) return flatLogs.length - 1;
    const idx = flatLogs.findIndex((l) => l.nodeId === selectedLogNodeId);
    return idx >= 0 ? idx : flatLogs.length - 1;
  }, [flatLogs, selectedLogNodeId]);

  const selectedNetIndex = useMemo(() => {
    if (!flatNet.length) return -1;
    if (!selectedNetNodeId) return flatNet.length - 1;
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
      // ensure there's always an active selection once logs exist
      setSelectedLogNodeId(flatLogs[flatLogs.length - 1]?.nodeId ?? null);
    }

    if (followTail) {
      setSelectedLogNodeId(flatLogs[flatLogs.length - 1]?.nodeId ?? null);
      setLogScrollTop(Math.max(0, flatLogs.length - visibleLogLines));
      return;
    }

    setLogScrollTop((top) =>
      clamp(top, 0, Math.max(0, flatLogs.length - visibleLogLines)),
    );
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

    setNetScrollTop((top) =>
      clamp(top, 0, Math.max(0, flatNet.length - visibleLogLines)),
    );
  }, [flatNet.length, followNetTail, visibleLogLines]);

  useEffect(() => {
    // When filtering, pause auto-follow to keep selection stable.
    if (netSearchQuery.trim()) setFollowNetTail(false);
  }, [netSearchQuery]);

  useEffect(() => {
    // When filtering logs, pause auto-follow to keep selection stable.
    if (logSearchQuery.trim()) setFollowTail(false);
  }, [logSearchQuery]);

  useEffect(() => {
    if (focus !== "right" || rightTab !== "logs") return;
    if (!flatLogs.length) return;
    if (selectedLogIndex < 0) return;

    setLogScrollTop((top) => {
      const maxTop = Math.max(0, flatLogs.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedLogIndex < nextTop) nextTop = selectedLogIndex;
      if (selectedLogIndex >= nextTop + visibleLogLines)
        nextTop = selectedLogIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, selectedLogIndex, flatLogs.length, visibleLogLines]);

  useEffect(() => {
    if (focus !== "right" || rightTab !== "network") return;
    if (!flatNet.length) return;
    if (selectedNetIndex < 0) return;

    setNetScrollTop((top) => {
      const maxTop = Math.max(0, flatNet.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedNetIndex < nextTop) nextTop = selectedNetIndex;
      if (selectedNetIndex >= nextTop + visibleLogLines)
        nextTop = selectedNetIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, rightTab, selectedNetIndex, flatNet.length, visibleLogLines]);

  const appendTextLog = (line: string) => {
    const newLines = splitLines(line);
    setLogTree((prev) => {
      const next = prev.concat(
        newLines.map((t) => ({
          id: newNodeId(),
          kind: "text" as const,
          text: t,
        })),
      );
      if (next.length > LOG_MAX_LINES)
        return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };

  const appendEntryLog = (
    label: string,
    args: RemoteObject[] = [],
    timestamp?: number,
  ) => {
    setLogTree((prev) => {
      const next = prev.concat([
        {
          id: newNodeId(),
          kind: "entry" as const,
          label,
          args,
          timestamp,
          expanded: false,
        },
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

  type NetRecord = {
    requestId: string;
    startTimestamp?: number;
    endTimestamp?: number;
    method?: string;
    url?: string;
    type?: string;
    initiator?: string;
    requestHeaders?: Record<string, string>;
    postData?: string;
    status?: number;
    statusText?: string;
    mimeType?: string;
    protocol?: string;
    remoteIPAddress?: string;
    remotePort?: number;
    fromDiskCache?: boolean;
    fromServiceWorker?: boolean;
    responseHeaders?: Record<string, string>;
    encodedDataLength?: number;
    errorText?: string;
    canceled?: boolean;
    responseBody?: { body: string; base64Encoded: boolean };
  };

  const netByIdRef = useRef<Map<string, NetRecord>>(new Map());

  const upsertNet = (rid: string, patch: Partial<NetRecord>) => {
    const prev =
      netByIdRef.current.get(rid) ?? ({ requestId: rid } as NetRecord);
    netByIdRef.current.set(rid, { ...prev, ...patch });
  };

  const getNetLabel = (rid: string) => {
    const r = netByIdRef.current.get(rid);
    const time = formatTime(r?.startTimestamp ?? Date.now());
    const method = r?.method ?? "";
    const url = r?.url ?? "";
    const status = typeof r?.status === "number" ? r.status : undefined;
    const tail = r?.errorText
      ? ` ✖ ${r.errorText}`
      : status != null
        ? ` ${status}`
        : "";
    return `[${time}] ${method} ${url}${tail}`.trimEnd();
  };

  const setNetNode = (rid: string, updater: (n: LogNode) => LogNode) => {
    const id = `net:${rid}`;
    setNetTree((prev) => updateNodeById(prev, id, updater));
  };

  const ensureNetRequestNode = (rid: string) => {
    setNetTree((prev) => {
      const id = `net:${rid}`;
      if (findNodeById(prev, id)) {
        return updateNodeById(prev, id, (n) => ({
          ...n,
          label: getNetLabel(rid),
        }));
      }
      const next = prev.concat([
        {
          id,
          kind: "entry" as const,
          label: getNetLabel(rid),
          expanded: false,
          net: { requestId: rid, role: "request" },
        },
      ]);
      const NET_MAX = 1500;
      return next.length > NET_MAX ? next.slice(next.length - NET_MAX) : next;
    });
  };

  const buildHeadersChildren = (headers?: Record<string, string>) => {
    const entries = Object.entries(headers ?? {});
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const LIMIT = 120;
    const sliced = entries.slice(0, LIMIT);
    const children: LogNode[] = sliced.map(([k, v]) => ({
      id: newNodeId(),
      kind: "text" as const,
      text: `${k}: ${v}`,
    }));
    if (entries.length > LIMIT) {
      children.push({
        id: newNodeId(),
        kind: "meta" as const,
        text: `… (${entries.length - LIMIT} more headers)`,
      });
    }
    if (children.length === 0)
      children.push({
        id: newNodeId(),
        kind: "meta" as const,
        text: "(no headers)",
      });
    return children;
  };

  const buildNetChildren = (rid: string): LogNode[] => {
    const r = netByIdRef.current.get(rid);
    const meta: LogNode[] = [];
    if (r?.type)
      meta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `type: ${r.type}`,
      });
    if (r?.initiator)
      meta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `initiator: ${r.initiator}`,
      });
    if (typeof r?.encodedDataLength === "number")
      meta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `bytes: ${r.encodedDataLength}`,
      });

    const reqHeadersNode: LogNode = {
      id: `net:${rid}:reqHeaders`,
      kind: "entry" as const,
      label: `Request Headers (${Object.keys(r?.requestHeaders ?? {}).length})`,
      expanded: false,
      children: buildHeadersChildren(r?.requestHeaders),
      net: { requestId: rid, role: "headers", which: "request" },
    };

    const resLineParts: string[] = [];
    if (typeof r?.status === "number") resLineParts.push(String(r.status));
    if (r?.statusText) resLineParts.push(r.statusText);
    if (r?.mimeType) resLineParts.push(r.mimeType);
    const resMeta: LogNode[] = [];
    if (r?.protocol)
      resMeta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `protocol: ${r.protocol}`,
      });
    if (r?.remoteIPAddress) {
      const port = typeof r.remotePort === "number" ? `:${r.remotePort}` : "";
      resMeta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `remote: ${r.remoteIPAddress}${port}`,
      });
    }
    if (r?.fromDiskCache)
      resMeta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `fromDiskCache: true`,
      });
    if (r?.fromServiceWorker)
      resMeta.push({
        id: newNodeId(),
        kind: "text" as const,
        text: `fromServiceWorker: true`,
      });

    const resHeadersNode: LogNode = {
      id: `net:${rid}:resHeaders`,
      kind: "entry" as const,
      label: `Response Headers (${
        Object.keys(r?.responseHeaders ?? {}).length
      })`,
      expanded: false,
      children: buildHeadersChildren(r?.responseHeaders),
      net: { requestId: rid, role: "headers", which: "response" },
    };

    const bodyNode: LogNode = {
      id: `net:${rid}:body`,
      kind: "entry" as const,
      label: "Response Body",
      expanded: false,
      children: [
        { id: newNodeId(), kind: "meta" as const, text: "(press z to load)" },
      ],
      net: { requestId: rid, role: "body" },
    };

    const responseNode: LogNode = {
      id: `net:${rid}:response`,
      kind: "entry" as const,
      label: `Response${
        resLineParts.length ? `: ${resLineParts.join(" ")}` : ""
      }`,
      expanded: false,
      children: [resHeadersNode, ...resMeta, bodyNode],
      net: { requestId: rid, role: "response" },
    };

    const reqBodyNode: LogNode = {
      id: `net:${rid}:reqBody`,
      kind: "entry" as const,
      label: "Request Body",
      expanded: false,
      children: [
        { id: newNodeId(), kind: "meta" as const, text: "(press z to view)" },
      ],
      net: { requestId: rid, role: "body", which: "request" },
    };

    const reqMeta: LogNode[] = [];
    if (r?.postData) {
      reqMeta.push(reqBodyNode);
    }

    return [...meta, reqHeadersNode, ...reqMeta, responseNode];
  };

  const loadResponseBody = async (
    rid: string,
  ): Promise<{ body: string; base64Encoded: boolean }> => {
    const c = clientRef.current as any;
    const Network = c?.Network;
    if (!Network?.getResponseBody)
      throw new Error(
        "Network.getResponseBody is not available (not attached?)",
      );
    const res = await Network.getResponseBody({ requestId: rid });
    return {
      body: String(res?.body ?? ""),
      base64Encoded: Boolean(res?.base64Encoded),
    };
  };

  const ensureEntryChildren = (node: LogNode): LogNode => {
    if (node.kind !== "entry") return node;
    if (node.children && node.children.length > 0) return node;
    const args = Array.isArray(node.args) ? node.args : [];
    const children: LogNode[] = args.map((obj, i) => ({
      id: `${node.id}:arg:${i}`,
      kind: "arg" as const,
      object: obj,
      expanded: false,
    }));
    return { ...node, children };
  };

  const ensureObjectChildrenLoading = (nodeId: string) => {
    setLogTree((prev) =>
      updateNodeById(prev, nodeId, (n) => {
        if (n.kind !== "arg" && n.kind !== "prop") return n;
        if (n.loading) return n;
        const obj = n.kind === "arg" ? n.object : n.value;
        if (!isObjectExpandable(obj)) return n;
        return {
          ...n,
          loading: true,
          children: [
            {
              id: newNodeId(),
              kind: "meta" as const,
              text: "(loading properties...)",
            },
          ],
        };
      }),
    );
  };

  const setObjectChildren = (nodeId: string, children: LogNode[]) => {
    setLogTree((prev) =>
      updateNodeById(prev, nodeId, (n) => ({
        ...n,
        loading: false,
        children,
      })),
    );
  };

  const loadPropertiesForObjectId = async (objectId: string) => {
    const c = clientRef.current as any;
    const Runtime = c?.Runtime;
    if (!Runtime?.getProperties)
      throw new Error("Runtime.getProperties is not available (not attached?)");

    const res = await Runtime.getProperties({
      objectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: true,
    });

    const list: any[] = Array.isArray(res?.result) ? res.result : [];
    const items: Array<{
      name: string;
      value: RemoteObject;
      enumerable: boolean;
    }> = list
      .filter((p: any) => p && typeof p.name === "string" && p.value)
      .map((p: any) => ({
        name: String(p.name),
        value: p.value as RemoteObject,
        enumerable: Boolean(p.enumerable),
      }));

    items.sort(
      (a, b) =>
        Number(b.enumerable) - Number(a.enumerable) ||
        a.name.localeCompare(b.name),
    );

    const LIMIT = 80;
    const sliced = items.slice(0, LIMIT);
    const children: LogNode[] = sliced.map(
      (it: { name: string; value: RemoteObject }) => ({
        id: newNodeId(),
        kind: "prop" as const,
        name: it.name,
        value: it.value,
        expanded: false,
      }),
    );

    if (items.length > LIMIT) {
      children.push({
        id: newNodeId(),
        kind: "meta" as const,
        text: `… (${items.length - LIMIT} more properties)`,
      });
    }

    return children;
  };

  const toggleExpandSelected = async () => {
    if (isExpandingRef.current) return;
    if (!flatLogs.length) return;
    const nodeId = selectedLogNodeId ?? flatLogs[flatLogs.length - 1]?.nodeId;
    if (!nodeId) return;

    const node = findNodeById(logTree, nodeId);
    if (!node) return;

    const expandable =
      node.kind === "entry"
        ? Array.isArray(node.args) && node.args.length > 0
        : node.kind === "arg"
          ? isObjectExpandable(node.object)
          : node.kind === "prop"
            ? isObjectExpandable(node.value)
            : false;

    if (!expandable) return;

    const nextExpanded = !Boolean(node.expanded);

    if (node.kind === "entry") {
      const args = Array.isArray(node.args) ? node.args : [];
      const firstArg = args[0] as RemoteObject | undefined;
      const autoExpandArg0 =
        nextExpanded && args.length === 1 && isObjectExpandable(firstArg);
      const arg0 = autoExpandArg0 ? firstArg : null;
      const arg0Id = autoExpandArg0 ? `${nodeId}:arg:0` : null;

      setLogTree((prev) =>
        updateNodeById(prev, nodeId, (n) => {
          const ensured = ensureEntryChildren(n);
          if (!autoExpandArg0) return { ...ensured, expanded: nextExpanded };

          const children = Array.isArray(ensured.children)
            ? ensured.children
            : [];
          const first = children[0];
          const rest = children.slice(1);
          const updatedFirst = first
            ? {
                ...first,
                expanded: true,
                loading: true,
                children: [
                  {
                    id: newNodeId(),
                    kind: "meta" as const,
                    text: "(loading properties...)",
                  },
                ],
              }
            : first;
          return {
            ...ensured,
            expanded: nextExpanded,
            children: updatedFirst ? [updatedFirst, ...rest] : children,
          };
        }),
      );

      if (autoExpandArg0 && arg0 && arg0Id) {
        isExpandingRef.current = true;
        try {
          const children = await loadPropertiesForObjectId(arg0.objectId);
          setObjectChildren(arg0Id, children);
        } catch (err) {
          setObjectChildren(arg0Id, [
            {
              id: newNodeId(),
              kind: "meta" as const,
              text: `[props] ! ${String(err)}`,
            },
          ]);
        } finally {
          isExpandingRef.current = false;
        }
      }
      return;
    }

    // arg/prop expansion requires fetching properties
    setLogTree((prev) =>
      updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })),
    );

    if (!nextExpanded) return;

    const obj = node.kind === "arg" ? node.object : node.value;
    if (!isObjectExpandable(obj)) return;

    // If already loaded (and not just loading meta), don't refetch
    if (
      Array.isArray(node.children) &&
      node.children.length > 0 &&
      !node.loading
    )
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
          kind: "meta" as const,
          text: `[props] ! ${String(err)}`,
        },
      ]);
    } finally {
      isExpandingRef.current = false;
    }
  };

  const collapseSelectedRegion = () => {
    if (!flatLogs.length) return;
    const currentId =
      selectedLogNodeId ?? flatLogs[flatLogs.length - 1]?.nodeId;
    if (!currentId) return;

    // If current node is expanded, collapse it.
    const current = findNodeById(logTree, currentId);
    if (current?.expanded) {
      setLogTree((prev) =>
        updateNodeById(prev, currentId, (n) => ({ ...n, expanded: false })),
      );
      return;
    }

    // Otherwise collapse the closest expanded ancestor.
    const flatIndex = flatLogs.findIndex((l) => l.nodeId === currentId);
    if (flatIndex < 0) return;

    let parentId = flatLogs[flatIndex]?.parentId ?? null;
    while (parentId) {
      const parentNode = findNodeById(logTree, parentId);
      if (parentNode?.expanded) {
        const pid = parentId;
        setSelectedLogNodeId(pid);
        setLogTree((prev) =>
          updateNodeById(prev, pid, (n) => ({ ...n, expanded: false })),
        );
        return;
      }

      const parentFlatIndex = flatLogs.findIndex((l) => l.nodeId === parentId);
      parentId =
        parentFlatIndex >= 0 ? flatLogs[parentFlatIndex]!.parentId : null;
    }
  };

  const toggleNetExpandSelected = async () => {
    if (isExpandingRef.current) return;
    if (!flatNet.length) return;
    const nodeId = selectedNetNodeId ?? flatNet[flatNet.length - 1]?.nodeId;
    if (!nodeId) return;

    const node = findNodeById(netTree, nodeId);
    if (!node) return;

    const hasChildren =
      Array.isArray(node.children) && node.children.length > 0;
    const expandable =
      node.kind === "entry" ? hasChildren || Boolean(node.net) : false;
    if (!expandable) return;

    const nextExpanded = !Boolean(node.expanded);

    // request node: build children lazily from current record
    if (node.net?.role === "request") {
      const rid = node.net.requestId;
      setNetTree((prev) =>
        updateNodeById(prev, nodeId, (n) => {
          const already = Array.isArray(n.children) && n.children.length > 0;
          const children = already ? n.children : buildNetChildren(rid);
          return { ...n, expanded: nextExpanded, children };
        }),
      );
      return;
    }

    // request body node: format on first expand
    if (node.net?.role === "body" && node.net?.which === "request") {
      const rid = node.net.requestId;
      setNetTree((prev) =>
        updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })),
      );
      if (!nextExpanded) return;

      const record = netByIdRef.current.get(rid);
      if (record?.postData) {
        const { lines, typeHint } = formatResponseBody(record.postData, false);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children: LogNode[] = [
          { id: newNodeId(), kind: "meta" as const, text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text" as const,
            text: t,
          })),
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta" as const,
            text: `… (${lines.length - LIMIT} more lines)`,
          });
        }
        setNetTree((prev) =>
          updateNodeById(prev, nodeId, (n) => ({ ...n, children })),
        );
        return;
      }
      return;
    }

    // response body node: fetch on first expand
    if (node.net?.role === "body") {
      const rid = node.net.requestId;
      setNetTree((prev) =>
        updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })),
      );
      if (!nextExpanded) return;

      const record = netByIdRef.current.get(rid);
      if (record?.responseBody) {
        const rb = record.responseBody;
        const { lines, typeHint } = formatResponseBody(
          rb.body,
          rb.base64Encoded,
        );
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children: LogNode[] = [
          { id: newNodeId(), kind: "meta" as const, text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text" as const,
            text: t,
          })),
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta" as const,
            text: `… (${lines.length - LIMIT} more lines)`,
          });
        }
        setNetTree((prev) =>
          updateNodeById(prev, nodeId, (n) => ({ ...n, children })),
        );
        return;
      }

      isExpandingRef.current = true;
      setNetTree((prev) =>
        updateNodeById(prev, nodeId, (n) => ({
          ...n,
          loading: true,
          children: [
            {
              id: newNodeId(),
              kind: "meta" as const,
              text: "(loading response body...)",
            },
          ],
        })),
      );
      try {
        const body = await loadResponseBody(rid);
        upsertNet(rid, { responseBody: body });
        const { lines, typeHint } = formatResponseBody(
          body.body,
          body.base64Encoded,
        );
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children: LogNode[] = [
          { id: newNodeId(), kind: "meta" as const, text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text" as const,
            text: t,
          })),
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta" as const,
            text: `… (${lines.length - LIMIT} more lines)`,
          });
        }
        setNetTree((prev) =>
          updateNodeById(prev, nodeId, (n) => ({
            ...n,
            loading: false,
            children,
          })),
        );
      } catch (err) {
        setNetTree((prev) =>
          updateNodeById(prev, nodeId, (n) => ({
            ...n,
            loading: false,
            children: [
              {
                id: newNodeId(),
                kind: "meta" as const,
                text: `[body] ! ${String(err)}`,
              },
            ],
          })),
        );
      } finally {
        isExpandingRef.current = false;
      }
      return;
    }

    // default: just toggle
    setNetTree((prev) =>
      updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })),
    );
  };

  const collapseNetSelectedRegion = () => {
    if (!flatNet.length) return;
    const currentId = selectedNetNodeId ?? flatNet[flatNet.length - 1]?.nodeId;
    if (!currentId) return;

    const current = findNodeById(netTree, currentId);
    if (current?.expanded) {
      setNetTree((prev) =>
        updateNodeById(prev, currentId, (n) => ({ ...n, expanded: false })),
      );
      return;
    }

    const flatIndex = flatNet.findIndex((l) => l.nodeId === currentId);
    if (flatIndex < 0) return;
    let parentId = flatNet[flatIndex]?.parentId ?? null;
    while (parentId) {
      const parentNode = findNodeById(netTree, parentId);
      if (parentNode?.expanded) {
        const pid = parentId;
        setSelectedNetNodeId(pid);
        setNetTree((prev) =>
          updateNodeById(prev, pid, (n) => ({ ...n, expanded: false })),
        );
        return;
      }
      const parentFlatIndex = flatNet.findIndex((l) => l.nodeId === parentId);
      parentId =
        parentFlatIndex >= 0 ? flatNet[parentFlatIndex]!.parentId : null;
    }
  };

  const refreshTargets = async (preferIndex?: number) => {
    setStatus(`fetching targets from ${host}:${port} ...`);

    const fetch = async (h: string) => {
      return await listTargets({ host: h, port });
    };

    try {
      const t = await fetch(host);
      setTargets(t);
      const prevSelectedId = selectedTargetIdRef.current;
      const prevAttachedId = attachedTargetIdRef.current;

      const selectedById =
        prevSelectedId != null
          ? t.findIndex((x) => x.id === prevSelectedId)
          : -1;
      const attachedById =
        prevAttachedId != null
          ? t.findIndex((x) => x.id === prevAttachedId)
          : -1;

      const idxRaw =
        selectedById >= 0
          ? selectedById
          : typeof preferIndex === "number"
            ? preferIndex
            : selectedIndex;
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
          const idx = clamp(
            typeof preferIndex === "number" ? preferIndex : selectedIndex,
            0,
            Math.max(0, t.length - 1),
          );
          setSelectedIndex(idx);
          appendTextLog("[hint] localhost failed; switched host to 127.0.0.1");
          setStatus(`targets: ${t.length}  |  127.0.0.1:${port}`);
          return;
        } catch {
          // fallthrough
        }
      }

      if (lastFetchErrorRef.current !== firstErr) {
        appendTextLog(firstErr);
        lastFetchErrorRef.current = firstErr;
      }
      setTargets([]);
      setStatus(`failed to fetch targets from ${host}:${port}`);

      if (!hasShownConnectHelpRef.current) {
        hasShownConnectHelpRef.current = true;
        appendTextLog(
          [
            "[hint] Start Chrome with remote debugging enabled:",
            '  open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp',
            "[hint] Verify endpoint:",
            `  curl http://${host}:${port}/json/list`,
          ].join("\n"),
        );
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

    if (!expr) return;

    appendTextLog(`[eval] ${expr}`);

    const c = clientRef.current as any;
    const Runtime = c?.Runtime;
    if (!Runtime?.evaluate) {
      appendTextLog("[eval] ! not attached (select a target and press Enter)");
      return;
    }

    try {
      const res = await Runtime.evaluate({
        expression: expr,
        awaitPromise: true,
        returnByValue: false,
      });

      if (res?.exceptionDetails) {
        const text = String(res.exceptionDetails.text ?? "exception");
        appendTextLog(`[eval] ! ${text}`);
        if (res.exceptionDetails.exception) {
          appendEntryLog(
            `eval!`,
            [res.exceptionDetails.exception as RemoteObject],
            Date.now(),
          );
        }
        return;
      }

      appendEntryLog(`eval =>`, [res?.result as RemoteObject], Date.now());
    } catch (err) {
      appendTextLog(`[eval] ! ${String(err)}`);
    }
  };

  const attachByIndex = async (index: number) => {
    if (isAttachingRef.current) return;
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

      let c: Client;
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

      const anyClient = c as any;
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
          Network?.enable?.(),
        ]);
      } catch (err) {
        appendTextLog(`[enable] ${String(err)}`);
      }

      Runtime?.consoleAPICalled?.((p: any) => {
        const time = formatTime(p?.timestamp ?? Date.now());
        const type = String(p?.type ?? "log");
        const args = Array.isArray(p?.args) ? (p.args as RemoteObject[]) : [];
        appendEntryLog(`[${time}] console.${type}`, args, p?.timestamp);
      });

      Runtime?.exceptionThrown?.((p: any) => {
        const time = formatTime(p?.timestamp ?? Date.now());
        const details = p?.exceptionDetails;
        const text = details?.text ? String(details.text) : "exception";
        const args = details?.exception
          ? ([details.exception] as RemoteObject[])
          : [];
        appendEntryLog(
          `[${time}] exception ${text}`.trimEnd(),
          args,
          p?.timestamp,
        );
      });

      Console?.messageAdded?.((p: any) => {
        const msg = p?.message ?? p;
        // Avoid duplicates with Runtime.consoleAPICalled.
        // Console.messageAdded includes console-api messages which overlap with Runtime.consoleAPICalled.
        const source =
          typeof msg?.source === "string" ? String(msg.source) : "";
        if (source === "console-api") return;

        const time = formatTime(msg?.timestamp ?? Date.now());
        const level = String(msg?.level ?? "log");
        const text = String(msg?.text ?? "");
        const params = Array.isArray(msg?.parameters)
          ? (msg.parameters as RemoteObject[])
          : [];
        appendEntryLog(
          `[${time}] console.${level} ${text}`.trimEnd(),
          params,
          msg?.timestamp,
        );
      });

      Log?.entryAdded?.((p: any) => {
        const entry = p?.entry ?? p;
        const time = formatTime(entry?.timestamp ?? Date.now());
        const level = String(entry?.level ?? "info");
        const text = String(entry?.text ?? "");
        const url = entry?.url ? ` (${entry.url})` : "";
        appendTextLog(`[${time}] log.${level} ${text}${url}`.trimEnd());
      });

      Network?.requestWillBeSent?.((p: any) => {
        const rid = String(p?.requestId ?? "");
        if (!rid) return;
        const req = p?.request;
        const url = String(req?.url ?? "");
        const method = String(req?.method ?? "");
        const headers = (req?.headers ?? {}) as Record<string, string>;
        const postData =
          typeof req?.postData === "string" ? req.postData : undefined;
        const initiatorUrl = p?.initiator?.url
          ? String(p.initiator.url)
          : undefined;

        upsertNet(rid, {
          startTimestamp: p?.timestamp,
          method,
          url,
          requestHeaders: headers,
          postData,
          initiator: initiatorUrl,
          type: p?.type ? String(p.type) : undefined,
        });
        ensureNetRequestNode(rid);
      });

      Network?.responseReceived?.((p: any) => {
        const rid = String(p?.requestId ?? "");
        if (!rid) return;
        const res = p?.response;
        const headers = (res?.headers ?? {}) as Record<string, string>;
        upsertNet(rid, {
          status: typeof res?.status === "number" ? res.status : undefined,
          statusText:
            typeof res?.statusText === "string" ? res.statusText : undefined,
          mimeType:
            typeof res?.mimeType === "string" ? res.mimeType : undefined,
          protocol:
            typeof res?.protocol === "string" ? res.protocol : undefined,
          remoteIPAddress:
            typeof res?.remoteIPAddress === "string"
              ? res.remoteIPAddress
              : undefined,
          remotePort:
            typeof res?.remotePort === "number" ? res.remotePort : undefined,
          fromDiskCache: Boolean(res?.fromDiskCache),
          fromServiceWorker: Boolean(res?.fromServiceWorker),
          responseHeaders: headers,
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => {
          const children =
            Array.isArray(n.children) && n.children.length > 0
              ? buildNetChildren(rid)
              : n.children;
          return { ...n, label: getNetLabel(rid), children };
        });
      });

      Network?.loadingFinished?.((p: any) => {
        const rid = String(p?.requestId ?? "");
        if (!rid) return;
        upsertNet(rid, {
          endTimestamp: p?.timestamp,
          encodedDataLength:
            typeof p?.encodedDataLength === "number"
              ? p.encodedDataLength
              : undefined,
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => ({ ...n, label: getNetLabel(rid) }));
      });

      Network?.loadingFailed?.((p: any) => {
        const rid = String(p?.requestId ?? "");
        if (!rid) return;
        upsertNet(rid, {
          endTimestamp: p?.timestamp,
          errorText: typeof p?.errorText === "string" ? p.errorText : "failed",
          canceled: Boolean(p?.canceled),
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => ({ ...n, label: getNetLabel(rid) }));
      });

      if (opts.network) {
        Network?.webSocketFrameSent?.((p: any) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(
            `[${time}] ws.sent ${truncate(payload, 200)}`.trimEnd(),
          );
        });

        Network?.webSocketFrameReceived?.((p: any) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(
            `[${time}] ws.recv ${truncate(payload, 200)}`.trimEnd(),
          );
        });
      }

      appendTextLog(`[attached] ${title}`);
      setStatus(`attached: ${title}  |  ${host}:${port}`);
      setFocus("right");
      setRightTab("logs");

      // quick sanity check to prove console pipeline works
      try {
        await Runtime?.evaluate?.({
          expression: `console.log("[termdev] attached", new Date().toISOString())`,
        });
      } catch {
        // ignore
      }
    } finally {
      isAttachingRef.current = false;
    }
  };

  useEffect(() => {
    void refreshTargets();
  }, []);

  useEffect(() => {
    if (!opts.pollMs || opts.pollMs <= 0) return;
    const id = setInterval(() => {
      void refreshTargets();
    }, opts.pollMs);
    return () => clearInterval(id);
  }, [opts.pollMs, host, port]);

  useEffect(() => {
    if (!opts.targetQuery) return;
    if (!targets.length) return;
    const picked = pickTargetByQuery(targets, opts.targetQuery);
    if (picked.target && picked.index >= 0) {
      setSelectedIndex(picked.index);
      void attachByIndex(picked.index);
    } else {
      appendTextLog(`[auto-attach] no match for: ${opts.targetQuery}`);
    }
    // only once after first non-empty fetch
  }, [targets.length]);

  useEffect(() => {
    return () => {
      void detach();
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
        void submitEval();
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

    if (logSearchOpen) {
      if (key.escape) {
        setLogSearchOpen(false);
        return;
      }
      if (key.return) {
        setLogSearchOpen(false);
        return;
      }
      if (key.ctrl && input === "u") {
        setLogSearchQuery("");
        return;
      }
      if (key.ctrl && input === "c") {
        exit();
        return;
      }
      return;
    }

    if (key.tab) {
      setFocus((f) => (f === "targets" ? "right" : "targets"));
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
      void refreshTargets();
      return;
    }

    if (input === ":") {
      setEvalOpen(true);
      setEvalText("");
      return;
    }

    if (focus === "targets") {
      if (key.upArrow || input === "k") {
        setSelectedIndex((i) =>
          clamp(i - 1, 0, Math.max(0, targets.length - 1)),
        );
        return;
      }
      if (key.downArrow || input === "j") {
        setSelectedIndex((i) =>
          clamp(i + 1, 0, Math.max(0, targets.length - 1)),
        );
        return;
      }
      if (key.return) {
        void attachByIndex(selectedIndex);
        return;
      }
    } else {
      // right panel focus (logs/network)
      if (input === "l") {
        setRightTab("logs");
        return;
      }
      if (input === "n") {
        setRightTab("network");
        return;
      }
      if (input === "[") {
        setRightTab((t) => (t === "logs" ? "network" : "logs"));
        return;
      }
      if (input === "]") {
        setRightTab((t) => (t === "logs" ? "network" : "logs"));
        return;
      }

      const activeFlat = rightTab === "logs" ? flatLogs : flatNet;
      const activeIndex =
        rightTab === "logs" ? selectedLogIndex : selectedNetIndex;
      const setActiveSelected = (id: string | null) => {
        if (rightTab === "logs") setSelectedLogNodeId(id);
        else setSelectedNetNodeId(id);
      };
      const setActiveFollow = (v: boolean) => {
        if (rightTab === "logs") setFollowTail(v);
        else setFollowNetTail(v);
      };

      if (key.upArrow || input === "k") {
        if (!activeFlat.length) return;
        setActiveFollow(false);
        const nextIdx = clamp(activeIndex - 1, 0, activeFlat.length - 1);
        setActiveSelected(activeFlat[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.downArrow || input === "j") {
        if (!activeFlat.length) return;
        const nextIdx = clamp(activeIndex + 1, 0, activeFlat.length - 1);
        setActiveSelected(activeFlat[nextIdx]?.nodeId ?? null);
        if (nextIdx === activeFlat.length - 1) setActiveFollow(true);
        else setActiveFollow(false);
        return;
      }
      if (key.pageUp || (key.ctrl && input === "u")) {
        if (!activeFlat.length) return;
        setActiveFollow(false);
        const nextIdx = clamp(
          activeIndex - visibleLogLines,
          0,
          activeFlat.length - 1,
        );
        setActiveSelected(activeFlat[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.pageDown || (key.ctrl && input === "d")) {
        if (!activeFlat.length) return;
        const nextIdx = clamp(
          activeIndex + visibleLogLines,
          0,
          activeFlat.length - 1,
        );
        setActiveSelected(activeFlat[nextIdx]?.nodeId ?? null);
        if (nextIdx === activeFlat.length - 1) setActiveFollow(true);
        else setActiveFollow(false);
        return;
      }

      if (input === "z") {
        if (rightTab === "logs") void toggleExpandSelected();
        else void toggleNetExpandSelected();
        return;
      }

      if (input === "Z") {
        if (rightTab === "logs") collapseSelectedRegion();
        else collapseNetSelectedRegion();
        return;
      }

      if (input === "y") {
        if (!activeFlat.length) return;
        const nodeId =
          (rightTab === "logs" ? selectedLogNodeId : selectedNetNodeId) ??
          activeFlat[activeFlat.length - 1]?.nodeId;
        if (!nodeId) return;

        const root =
          rightTab === "logs"
            ? findNodeById(logTree, nodeId)
            : findNodeById(netTree, nodeId);
        if (!root) return;

        // For network body nodes, only copy the body content (skip meta comments)
        const text =
          root.net?.role === "body"
            ? serializeBodyOnly(root).join("\n")
            : serializeNodeDeep(root, 0).join("\n");
        void (async () => {
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

      if (rightTab === "logs" && input === "/") {
        setLogSearchOpen(true);
        setFollowTail(false);
        return;
      }
    }

    if (input === "d") {
      void detach();
      return;
    }

    if (input === "p") {
      const c = clientRef.current as any;
      void c?.Runtime?.evaluate?.({
        expression: `console.log("[termdev] ping", new Date().toISOString())`,
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
        if (rightTab === "logs") setFollowTail(true);
        else setFollowNetTail(true);
      } else {
        setFollowTail(true);
      }
      return;
    }

    if (input === "?") {
      appendTextLog(
        "Keys: tab focus | q/esc quit | r refresh | targets: ↑↓/j k + enter attach | right: l logs / n network / [ ] switch | j/k select | z toggle | Z collapse | y copy | / filter | : eval | d detach | p ping | c clear(logs/network) | f follow",
      );
    }
  });

  useEffect(() => {
    setTargetScrollTop((top) => {
      const maxTop = Math.max(0, targets.length - visibleTargetItems);
      const curTop = clamp(top, 0, maxTop);
      if (selectedIndex < curTop) return selectedIndex;
      if (selectedIndex >= curTop + visibleTargetItems)
        return selectedIndex - visibleTargetItems + 1;
      return curTop;
    });
  }, [selectedIndex, targets.length, visibleTargetItems]);

  useEffect(() => {
    // keep selectedIndex in range when targets change
    setSelectedIndex((i) => clamp(i, 0, Math.max(0, targets.length - 1)));
  }, [targets.length]);

  const attachedTitle = useMemo(() => {
    if (attachedIndex == null) return null;
    const t = targets[attachedIndex];
    if (!t) return "(attached)";
    return (t.title ?? "").trim() || t.url || "(attached)";
  }, [targets, attachedIndex]);

  const targetsViewport = useMemo(() => {
    if (!targets.length)
      return [] as Array<{
        key: string;
        lines: [string, string];
        selected: boolean;
        attached: boolean;
        type: string;
        icon: string;
        color: string | undefined;
      }>;
    const slice = targets.slice(
      targetScrollTop,
      targetScrollTop + visibleTargetItems,
    );
    return slice.map((t, offset) => {
      const idx = targetScrollTop + offset;
      const selected = idx === selectedIndex;
      const attached = idx === attachedIndex;

      const title = (t.title ?? "").trim() || "(no title)";
      const url = (t.url ?? "").trim();
      const type = (t.type ?? "").trim();
      const icon = getTargetIcon(type);
      const color = getTargetColor(type, selected, attached);

      const statusIcon = attached ? "●" : selected ? "◦" : " ";
      const line1Prefix = `${icon} ${statusIcon} ${String(idx).padStart(2, " ")}`;
      const line1 = `${line1Prefix} ${title}`;
      const meta = [type ? `${type}` : "", url].filter(Boolean).join(" · ");
      const line2 = `      ${meta}`;

      const maxWidth = Math.max(10, Math.floor(columns * 0.33) - 6);
      return {
        key: t.id,
        lines: [truncate(line1, maxWidth), truncate(line2, maxWidth)] as [
          string,
          string,
        ],
        selected,
        attached,
        type,
        icon,
        color,
      };
    });
  }, [
    targets,
    targetScrollTop,
    visibleTargetItems,
    selectedIndex,
    attachedIndex,
    columns,
  ]);

  const activeFlat = rightTab === "logs" ? flatLogs : flatNet;
  const activeScrollTop = rightTab === "logs" ? logScrollTop : netScrollTop;
  const activeSelectedId =
    rightTab === "logs" ? selectedLogNodeId : selectedNetNodeId;
  const activeFollow = rightTab === "logs" ? followTail : followNetTail;

  const viewport = useMemo(() => {
    if (!activeFlat.length)
      return { start: 0, endExclusive: 0, lines: [] as FlatLogLine[] };
    const start = clamp(
      activeScrollTop,
      0,
      Math.max(0, activeFlat.length - visibleLogLines),
    );
    const endExclusive = clamp(start + visibleLogLines, 0, activeFlat.length);
    return {
      start,
      endExclusive,
      lines: activeFlat.slice(start, endExclusive),
    };
  }, [activeFlat, activeScrollTop, visibleLogLines]);

  // Show logo screen
  if (showLogo) {
    return <LogoScreen onDismiss={() => setShowLogo(false)} />;
  }

  // Colorful header with Nerd Font icons
  const headerTitle = headerGradient(`${ICONS.logo} TermDev`);
  const connectionStatus = attachedIndex !== null;

  return (
    <Box flexDirection="column" width="100%">
      <Box height={HEADER_HEIGHT}>
        <Text>{headerTitle}</Text>
        <Text dimColor> │ </Text>
        <Text color={connectionStatus ? "green" : "yellow"}>
          {connectionStatus ? ICONS.connected : ICONS.disconnected}
        </Text>
        <Text color={connectionStatus ? "green" : "yellow"}>
          {connectionStatus ? " connected" : " waiting"}
        </Text>
        <Text dimColor> │ </Text>
        <Text dimColor>
          {host}:{port}
        </Text>
        <Text dimColor> │ </Text>
        <Text color="cyan">{ICONS.list} </Text>
        <Text color="cyanBright" bold>
          {targets.length}
        </Text>
        {attachedTitle ? (
          <>
            <Text dimColor> │ </Text>
            <Text color="green">{ICONS.plug} </Text>
            <Text color="green">
              {truncate(attachedTitle, Math.max(10, columns - 65))}
            </Text>
          </>
        ) : null}
      </Box>

      <Box flexGrow={1} height={mainHeight}>
        <Box
          flexDirection="column"
          width="33%"
          borderStyle="round"
          borderColor={focus === "targets" ? "green" : "gray"}
          paddingX={1}
          paddingY={0}
          marginRight={1}
        >
          <Text bold color={focus === "targets" ? "cyan" : undefined}>
            {ICONS.list} Targets{focus === "targets" ? ` ${ICONS.star}` : ""}{" "}
            <Text dimColor>(↑↓ Enter)</Text>
          </Text>
          {targets.length === 0 ? (
            <Text dimColor>
              (no targets)
              {lastFetchErrorRef.current ? "" : "\nPress r to refresh"}
            </Text>
          ) : (
            <Box flexDirection="column">
              {targetsViewport.map((item) => (
                <Box key={item.key} flexDirection="column">
                  <Text
                    color={item.color as any}
                    bold={item.selected}
                    inverse={item.selected}
                  >
                    {item.lines[0]}
                  </Text>
                  <Text dimColor color={item.attached ? "green" : undefined}>
                    {item.lines[1]}
                  </Text>
                </Box>
              ))}
              {targets.length > visibleTargetItems ? (
                <Text dimColor>
                  {ICONS.bullet} {targetScrollTop + 1}-
                  {Math.min(
                    targetScrollTop + visibleTargetItems,
                    targets.length,
                  )}
                  /{targets.length}
                </Text>
              ) : null}
            </Box>
          )}
        </Box>

        <Box
          flexDirection="column"
          width="67%"
          borderStyle="round"
          borderColor={focus === "right" ? "green" : "gray"}
          paddingX={1}
        >
          <Text bold>
            <Text
              color={rightTab === "logs" ? "yellowBright" : "gray"}
              bold={rightTab === "logs"}
            >
              {ICONS.list} Logs
            </Text>
            <Text dimColor> │ </Text>
            <Text
              color={rightTab === "network" ? "magentaBright" : "gray"}
              bold={rightTab === "network"}
            >
              {ICONS.network} Network
            </Text>
            <Text dimColor>{"  "}</Text>
            <Text color="gray">
              ({viewport.start + 1}-{viewport.endExclusive}/{activeFlat.length})
            </Text>
            <Text color={activeFollow ? "green" : "yellow"}>
              {activeFollow
                ? ` ${ICONS.connected} follow`
                : ` ${ICONS.disconnected} paused`}
            </Text>
            {focus === "right" ? (
              <Text color="greenBright"> {ICONS.star}</Text>
            ) : null}
          </Text>
          <Box flexDirection="column">
            {viewport.lines.map((line, i) => {
              const idx = viewport.start + i;
              const isSelected =
                focus === "right" &&
                activeFlat[idx]?.nodeId === activeSelectedId;

              const icon = line.expandable
                ? line.expanded
                  ? ICONS.expand
                  : ICONS.collapse
                : " ";
              const prefix = `${" ".repeat(line.indent * 2)}${icon} `;
              const rendered = `${prefix}${line.text}`;

              const style = classifyLogLine(line.text);
              return (
                <Text
                  key={line.nodeId}
                  inverse={isSelected}
                  color={style.color as any}
                  dimColor={style.dim || (!isSelected && focus !== "right")}
                >
                  {truncate(
                    rendered,
                    Math.max(10, Math.floor(columns * 0.67) - 6),
                  )}
                </Text>
              );
            })}
          </Box>

          {evalOpen ? (
            <Box marginTop={0}>
              <Text color="greenBright" bold>
                {ICONS.zap} js›{" "}
              </Text>
              <TextInput value={evalText} onChange={setEvalText} />
              <Text dimColor> (Enter run, Esc cancel)</Text>
            </Box>
          ) : netSearchOpen ? (
            <Box marginTop={0}>
              <Text color="cyanBright" bold>
                {ICONS.search} /{" "}
              </Text>
              <TextInput value={netSearchQuery} onChange={setNetSearchQuery} />
              <Text dimColor> (Enter done, Esc close, Ctrl+U clear)</Text>
            </Box>
          ) : logSearchOpen ? (
            <Box marginTop={0}>
              <Text color="cyanBright" bold>
                {ICONS.search} /{" "}
              </Text>
              <TextInput value={logSearchQuery} onChange={setLogSearchQuery} />
              <Text dimColor> (Enter done, Esc close, Ctrl+U clear)</Text>
            </Box>
          ) : (
            <Text dimColor>
              <Text color="yellow">l</Text> logs <Text color="yellow">n</Text>{" "}
              network <Text color="yellow">j/k</Text> select{" "}
              <Text color="yellow">z</Text> expand <Text color="yellow">/</Text>{" "}
              filter <Text color="yellow">:</Text> eval
            </Text>
          )}
        </Box>
      </Box>
      <Box>
        <Text backgroundColor="gray" color="black">
          {" "}
          <Text color={connectionStatus ? "green" : "yellow"}>
            {connectionStatus ? ICONS.connected : ICONS.disconnected}
          </Text>{" "}
        </Text>
        <Text backgroundColor="gray" color="black">
          {truncate(status, Math.max(10, columns - 60))}
        </Text>
        <Text backgroundColor="gray" color="black">
          {" "}
          │{" "}
        </Text>
        <Text backgroundColor="gray" color="blue" bold>
          tab
        </Text>
        <Text backgroundColor="gray" color="black">
          {" "}
          focus{" "}
        </Text>
        <Text backgroundColor="gray" color="blue" bold>
          r
        </Text>
        <Text backgroundColor="gray" color="black">
          {" "}
          refresh{" "}
        </Text>
        <Text backgroundColor="gray" color="blue" bold>
          c
        </Text>
        <Text backgroundColor="gray" color="black">
          {" "}
          clear{" "}
        </Text>
        <Text backgroundColor="gray" color="blue" bold>
          q
        </Text>
        <Text backgroundColor="gray" color="black">
          {" "}
          quit{" "}
        </Text>
        <Text backgroundColor="gray" color="black">
          {" ".repeat(Math.max(0, columns - 80))}
        </Text>
      </Box>
    </Box>
  );
}

export async function runTui(opts: CliOptions): Promise<void> {
  const instance = render(
    <App
      opts={{
        host: opts.host,
        port: opts.port,
        network: opts.network,
        pollMs: opts.pollMs,
        targetQuery: opts.targetQuery,
      }}
    />,
  );

  await instance.waitUntilExit();
}
