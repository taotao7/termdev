import CDPImport from "chrome-remote-interface";
import type { Client } from "chrome-remote-interface";

import type { CdpTarget, TransportOptions } from "./types.ts";

const CDP: any = (CDPImport as any)?.default ?? (CDPImport as any);

export async function listTargets(opts: TransportOptions): Promise<CdpTarget[]> {
  const targets = await CDP.List({ host: opts.host, port: opts.port });
  return (targets ?? []) as CdpTarget[];
}

export async function connectToTarget(target: CdpTarget, opts: TransportOptions): Promise<Client> {
  const targetOpt = target.webSocketDebuggerUrl ?? target.id;
  return (await CDP({ host: opts.host, port: opts.port, target: targetOpt })) as Client;
}

export async function safeCloseClient(client: Client | null | undefined): Promise<void> {
  if (!client) return;
  try {
    await client.close();
  } catch {
    // ignore
  }
}
