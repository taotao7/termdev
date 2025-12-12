import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, render, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import type { Client } from "chrome-remote-interface";

import { connectToTarget, listTargets, safeCloseClient } from "./cdp.ts";
import {
  formatRemoteObject,
  formatTime,
} from "./format.ts";
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

const HEADER_HEIGHT = 1;
const FOOTER_HEIGHT = 1;
const MIN_ROWS = 12;
const TARGET_LINES_PER_ITEM = 2;

type Focus = "targets" | "logs";

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
};

type FlatLogLine = {
  nodeId: string;
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

function classifyLogLine(line: string): { color?: string; dim?: boolean } {
  const l = line.toLowerCase();
  if (l.includes("exception") || l.includes("console.error") || l.includes("log.error")) return { color: "red" };
  if (l.includes("warn") || l.includes("warning") || l.includes("console.warn") || l.includes("log.warning")) {
    return { color: "yellow" };
  }
  if (l.startsWith("[eval]")) return { color: "green" };
  if (l.startsWith("eval>") || l.startsWith("[eval]")) return { color: "green" };
  if (l.includes("[props]")) return { color: "cyan" };
  if (l.includes("net.request")) return { color: "cyan", dim: true };
  if (l.includes("net.response")) return { color: "cyan", dim: true };
  if (l.startsWith("[hint]")) return { color: "magenta" };
  if (l.startsWith("[attached]") || l.startsWith("[transport]")) return { color: "green" };
  return { dim: false };
}

function isObjectExpandable(obj: RemoteObject | undefined): obj is RemoteObject & { objectId: string } {
  return Boolean(obj && typeof obj === "object" && typeof (obj as any).objectId === "string" && (obj as any).objectId.length > 0);
}

function flattenLogTree(nodes: LogNode[], indent = 0): FlatLogLine[] {
  const out: FlatLogLine[] = [];
  for (const n of nodes) {
    const expandable =
      n.kind === "entry"
        ? Array.isArray(n.args) && n.args.length > 0
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

    out.push({ nodeId: n.id, indent, text, expandable, expanded });

    if (expanded && Array.isArray(n.children) && n.children.length > 0) {
      out.push(...flattenLogTree(n.children, indent + 1));
    }
  }
  return out;
}

function updateNodeById(nodes: LogNode[], id: string, updater: (n: LogNode) => LogNode): LogNode[] {
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

function App({ opts }: AppProps) {
  const { exit } = useApp();
  const { rows, columns } = useTerminalSizeFallback();
  const safeRows = Math.max(MIN_ROWS, rows);

  const [host, setHost] = useState(opts.host);
  const [port] = useState(opts.port);
  const [targets, setTargets] = useState<CdpTarget[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attachedIndex, setAttachedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string>(`connecting to ${opts.host}:${opts.port}...`);

  const [focus, setFocus] = useState<Focus>("targets");

  const [logTree, setLogTree] = useState<LogNode[]>([]);
  const [followTail, setFollowTail] = useState(true);
  const [logScrollTop, setLogScrollTop] = useState(0);
  const [selectedLogNodeId, setSelectedLogNodeId] = useState<string | null>(null);

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
    attachedTargetIdRef.current = attachedIndex == null ? null : targets[attachedIndex]?.id ?? null;
  }, [targets, attachedIndex]);

  const mainHeight = Math.max(1, safeRows - HEADER_HEIGHT - FOOTER_HEIGHT);
  const panelInnerHeight = Math.max(3, mainHeight - 2); // subtract border
  const logReserved = evalOpen ? 2 : 1;
  const visibleLogLines = Math.max(3, panelInnerHeight - 1 - logReserved); // subtract title line + input
  const visibleTargetItems = Math.max(1, Math.floor((panelInnerHeight - 1) / TARGET_LINES_PER_ITEM));

  const flatLogs = useMemo(() => flattenLogTree(logTree), [logTree]);

  const selectedLogIndex = useMemo(() => {
    if (!flatLogs.length) return -1;
    if (!selectedLogNodeId) return flatLogs.length - 1;
    const idx = flatLogs.findIndex((l) => l.nodeId === selectedLogNodeId);
    return idx >= 0 ? idx : flatLogs.length - 1;
  }, [flatLogs, selectedLogNodeId]);

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

    setLogScrollTop((top) => clamp(top, 0, Math.max(0, flatLogs.length - visibleLogLines)));
  }, [flatLogs.length, followTail, visibleLogLines]);

  useEffect(() => {
    if (focus !== "logs") return;
    if (!flatLogs.length) return;
    if (selectedLogIndex < 0) return;

    setLogScrollTop((top) => {
      const maxTop = Math.max(0, flatLogs.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedLogIndex < nextTop) nextTop = selectedLogIndex;
      if (selectedLogIndex >= nextTop + visibleLogLines) nextTop = selectedLogIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, selectedLogIndex, flatLogs.length, visibleLogLines]);

  const appendTextLog = (line: string) => {
    const newLines = splitLines(line);
    setLogTree((prev) => {
      const next = prev.concat(
        newLines.map((t) => ({ id: newNodeId(), kind: "text" as const, text: t })),
      );
      if (next.length > LOG_MAX_LINES) return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };

  const appendEntryLog = (label: string, args: RemoteObject[] = [], timestamp?: number) => {
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
      if (next.length > LOG_MAX_LINES) return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };

  const clearLogs = () => {
    setLogTree([]);
    setSelectedLogNodeId(null);
    setLogScrollTop(0);
    setFollowTail(true);
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
          children: [{ id: newNodeId(), kind: "meta" as const, text: "(loading properties...)" }],
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
    if (!Runtime?.getProperties) throw new Error("Runtime.getProperties is not available (not attached?)");

    const res = await Runtime.getProperties({
      objectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: true,
    });

    const list: any[] = Array.isArray(res?.result) ? res.result : [];
    const items: Array<{ name: string; value: RemoteObject; enumerable: boolean }> = list
      .filter((p: any) => p && typeof p.name === "string" && p.value)
      .map((p: any) => ({
        name: String(p.name),
        value: p.value as RemoteObject,
        enumerable: Boolean(p.enumerable),
      }));

    items.sort((a, b) => Number(b.enumerable) - Number(a.enumerable) || a.name.localeCompare(b.name));

    const LIMIT = 80;
    const sliced = items.slice(0, LIMIT);
    const children: LogNode[] = sliced.map((it: { name: string; value: RemoteObject }) => ({
      id: newNodeId(),
      kind: "prop" as const,
      name: it.name,
      value: it.value,
      expanded: false,
    }));

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
      const autoExpandArg0 = nextExpanded && args.length === 1 && isObjectExpandable(firstArg);
      const arg0 = autoExpandArg0 ? firstArg : null;
      const arg0Id = autoExpandArg0 ? `${nodeId}:arg:0` : null;

      setLogTree((prev) =>
        updateNodeById(prev, nodeId, (n) => {
          const ensured = ensureEntryChildren(n);
          if (!autoExpandArg0) return { ...ensured, expanded: nextExpanded };

          const children = Array.isArray(ensured.children) ? ensured.children : [];
          const first = children[0];
          const rest = children.slice(1);
          const updatedFirst = first
            ? {
                ...first,
                expanded: true,
                loading: true,
                children: [{ id: newNodeId(), kind: "meta" as const, text: "(loading properties...)" }],
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
          setObjectChildren(arg0Id, [{ id: newNodeId(), kind: "meta" as const, text: `[props] ! ${String(err)}` }]);
        } finally {
          isExpandingRef.current = false;
        }
      }
      return;
    }

    // arg/prop expansion requires fetching properties
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));

    if (!nextExpanded) return;

    const obj = node.kind === "arg" ? node.object : node.value;
    if (!isObjectExpandable(obj)) return;

    // If already loaded (and not just loading meta), don't refetch
    if (Array.isArray(node.children) && node.children.length > 0 && !node.loading) return;

    isExpandingRef.current = true;
    try {
      ensureObjectChildrenLoading(nodeId);
    const children = await loadPropertiesForObjectId(obj.objectId);
      setObjectChildren(nodeId, children);
    } catch (err) {
      setObjectChildren(nodeId, [{ id: newNodeId(), kind: "meta" as const, text: `[props] ! ${String(err)}` }]);
    } finally {
      isExpandingRef.current = false;
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
        prevSelectedId != null ? t.findIndex((x) => x.id === prevSelectedId) : -1;
      const attachedById =
        prevAttachedId != null ? t.findIndex((x) => x.id === prevAttachedId) : -1;

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
          appendEntryLog(`eval!`, [res.exceptionDetails.exception as RemoteObject], Date.now());
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
          opts.network ? Network?.enable?.() : Promise.resolve(),
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
        const args = details?.exception ? ([details.exception] as RemoteObject[]) : [];
        appendEntryLog(`[${time}] exception ${text}`.trimEnd(), args, p?.timestamp);
      });

      Console?.messageAdded?.((p: any) => {
        const msg = p?.message ?? p;
        const time = formatTime(msg?.timestamp ?? Date.now());
        const level = String(msg?.level ?? "log");
        const text = String(msg?.text ?? "");
        const params = Array.isArray(msg?.parameters) ? (msg.parameters as RemoteObject[]) : [];
        appendEntryLog(`[${time}] console.${level} ${text}`.trimEnd(), params, msg?.timestamp);
      });

      Log?.entryAdded?.((p: any) => {
        const entry = p?.entry ?? p;
        const time = formatTime(entry?.timestamp ?? Date.now());
        const level = String(entry?.level ?? "info");
        const text = String(entry?.text ?? "");
        const url = entry?.url ? ` (${entry.url})` : "";
        appendTextLog(`[${time}] log.${level} ${text}${url}`.trimEnd());
      });

      if (opts.network) {
        Network?.requestWillBeSent?.((p: any) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const req = p?.request;
          const method = req?.method ?? "";
          const url = req?.url ?? "";
          appendTextLog(`[${time}] net.request ${method} ${url}`.trimEnd());
        });

        Network?.responseReceived?.((p: any) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const res = p?.response;
          const statusCode = res?.status;
          const url = res?.url ?? "";
          appendTextLog(`[${time}] net.response ${statusCode} ${url}`.trimEnd());
        });

        Network?.webSocketFrameSent?.((p: any) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(`[${time}] ws.sent ${truncate(payload, 200)}`.trimEnd());
        });

        Network?.webSocketFrameReceived?.((p: any) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(`[${time}] ws.recv ${truncate(payload, 200)}`.trimEnd());
        });
      }

      appendTextLog(`[attached] ${title}`);
      setStatus(`attached: ${title}  |  ${host}:${port}`);
      setFocus("logs");

      // quick sanity check to prove console pipeline works
      try {
        await Runtime?.evaluate?.({
          expression: `console.log("[terminal-devtool] attached", new Date().toISOString())`,
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

    if (key.tab) {
      setFocus((f) => (f === "targets" ? "logs" : "targets"));
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
        setSelectedIndex((i) => clamp(i - 1, 0, Math.max(0, targets.length - 1)));
        return;
      }
      if (key.downArrow || input === "j") {
        setSelectedIndex((i) => clamp(i + 1, 0, Math.max(0, targets.length - 1)));
        return;
      }
      if (key.return) {
        void attachByIndex(selectedIndex);
        return;
      }
    } else {
      // logs focus
      if (key.upArrow || input === "k") {
        if (!flatLogs.length) return;
        setFollowTail(false);
        const nextIdx = clamp(selectedLogIndex - 1, 0, flatLogs.length - 1);
        setSelectedLogNodeId(flatLogs[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.downArrow || input === "j") {
        if (!flatLogs.length) return;
        const nextIdx = clamp(selectedLogIndex + 1, 0, flatLogs.length - 1);
        setSelectedLogNodeId(flatLogs[nextIdx]?.nodeId ?? null);
        if (nextIdx === flatLogs.length - 1) setFollowTail(true);
        else setFollowTail(false);
        return;
      }
      if (key.pageUp) {
        if (!flatLogs.length) return;
        setFollowTail(false);
        const nextIdx = clamp(selectedLogIndex - visibleLogLines, 0, flatLogs.length - 1);
        setSelectedLogNodeId(flatLogs[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.pageDown) {
        if (!flatLogs.length) return;
        const nextIdx = clamp(selectedLogIndex + visibleLogLines, 0, flatLogs.length - 1);
        setSelectedLogNodeId(flatLogs[nextIdx]?.nodeId ?? null);
        if (nextIdx === flatLogs.length - 1) setFollowTail(true);
        else setFollowTail(false);
        return;
      }

      if (input === "z") {
        void toggleExpandSelected();
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
        expression: `console.log("[terminal-devtool] ping", new Date().toISOString())`,
      });
      return;
    }

    if (input === "c") {
      clearLogs();
      setStatus("logs cleared");
      return;
    }

    if (input === "f") {
      setFollowTail(true);
      return;
    }

    if (input === "?") {
      appendTextLog(
        "Keys: tab focus | q/esc quit | r refresh | targets: ↑↓/j k + enter attach | logs: ↑↓/j k select + z expand | : eval | d detach | p ping | c clear | f follow",
      );
    }
  });

  useEffect(() => {
    setTargetScrollTop((top) => {
      const maxTop = Math.max(0, targets.length - visibleTargetItems);
      const curTop = clamp(top, 0, maxTop);
      if (selectedIndex < curTop) return selectedIndex;
      if (selectedIndex >= curTop + visibleTargetItems) return selectedIndex - visibleTargetItems + 1;
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

  const headerLeft = `terminal-devtool`;
  const headerRight = `${host}:${port}  •  targets:${targets.length}${attachedTitle ? `  •  attached:${attachedTitle}` : ""}`;

  const targetsViewport = useMemo(() => {
    if (!targets.length) return [] as Array<{ key: string; lines: [string, string]; selected: boolean; attached: boolean }>;
    const slice = targets.slice(targetScrollTop, targetScrollTop + visibleTargetItems);
    return slice.map((t, offset) => {
      const idx = targetScrollTop + offset;
      const selected = idx === selectedIndex;
      const attached = idx === attachedIndex;

      const title = (t.title ?? "").trim() || "(no title)";
      const url = (t.url ?? "").trim();
      const type = (t.type ?? "").trim();

      const line1Prefix = `${selected ? "❯" : " "}${attached ? "●" : " "} ${String(idx).padStart(2, " ")}`;
      const line1 = `${line1Prefix} ${title}`;
      const meta = [type ? `type=${type}` : "", url].filter(Boolean).join("  ");
      const line2 = `    ${meta}`;

      const maxWidth = Math.max(10, Math.floor(columns * 0.33) - 6);
      return {
        key: t.id,
        lines: [truncate(line1, maxWidth), truncate(line2, maxWidth)],
        selected,
        attached,
      };
    });
  }, [targets, targetScrollTop, visibleTargetItems, selectedIndex, attachedIndex, columns]);

  const logsViewport = useMemo(() => {
    if (!flatLogs.length) return { start: 0, endExclusive: 0, lines: [] as FlatLogLine[] };
    const start = clamp(logScrollTop, 0, Math.max(0, flatLogs.length - visibleLogLines));
    const endExclusive = clamp(start + visibleLogLines, 0, flatLogs.length);
    return { start, endExclusive, lines: flatLogs.slice(start, endExclusive) };
  }, [flatLogs, logScrollTop, visibleLogLines]);

  const footer = `${status}   |   tab focus(${focus})  z expand  : eval  q/esc quit  c clear  f follow`;

  return (
    <Box flexDirection="column" width="100%">
      <Box height={HEADER_HEIGHT}>
        <Text color="cyan" bold>
          {truncate(headerLeft, Math.max(10, columns))}
        </Text>
        <Text> </Text>
        <Text dimColor>{truncate(headerRight, Math.max(10, columns - headerLeft.length - 1))}</Text>
      </Box>

      <Box flexGrow={1} height={mainHeight}>
        <Box
          flexDirection="column"
          width="33%"
          borderStyle="round"
          borderColor="cyan"
          paddingX={1}
          paddingY={0}
          marginRight={1}
        >
          <Text bold>
            Targets <Text dimColor>(↑↓/j k, Enter)</Text>
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
                  <Text color={item.selected ? "green" : undefined} bold={item.selected}>
                    {item.lines[0]}
                  </Text>
                  <Text dimColor>{item.lines[1]}</Text>
                </Box>
              ))}
              {targets.length > visibleTargetItems ? (
                <Text dimColor>
                  ({targetScrollTop + 1}-{Math.min(targetScrollTop + visibleTargetItems, targets.length)}/{targets.length})
                </Text>
              ) : null}
            </Box>
          )}
        </Box>

        <Box flexDirection="column" width="67%" borderStyle="round" borderColor="cyan" paddingX={1}>
          <Text bold>
            Logs{" "}
            <Text dimColor>
              ({logsViewport.start + 1}-{logsViewport.endExclusive}/{flatLogs.length}) {followTail ? "• follow" : "• paused"}
            </Text>
          </Text>
          <Box flexDirection="column">
            {logsViewport.lines.map((line, i) => {
              const idx = logsViewport.start + i;
              const isSelected = focus === "logs" && flatLogs[idx]?.nodeId === selectedLogNodeId;

              const icon = line.expandable ? (line.expanded ? "▾" : "▸") : " ";
              const prefix = `${" ".repeat(line.indent * 2)}${icon} `;
              const rendered = `${prefix}${line.text}`;

              const style = classifyLogLine(line.text);
              return (
                <Text
                  key={line.nodeId}
                  inverse={isSelected}
                  color={style.color as any}
                  dimColor={style.dim || (!isSelected && focus !== "logs")}
                >
                  {truncate(rendered, Math.max(10, Math.floor(columns * 0.67) - 6))}
                </Text>
              );
            })}
          </Box>

          {evalOpen ? (
            <Box marginTop={0}>
              <Text color="green" bold>
                js›{" "}
              </Text>
              <TextInput value={evalText} onChange={setEvalText} />
              <Text dimColor>  (Enter run, Esc cancel)</Text>
            </Box>
          ) : (
            <Text dimColor>
              <Text bold>Logs:</Text> tab focus → ↑↓ select → <Text bold>z</Text> expand objects → <Text bold>:</Text> eval
            </Text>
          )}
        </Box>
      </Box>
      <Text inverse>{truncate(footer, Math.max(10, columns))}</Text>
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
