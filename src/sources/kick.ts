import { randomUUID } from "node:crypto";
import type { ConnectOptions, SourceHandle } from "./types.js";

// Kick has no official public chat API. As of 2026 the web client uses
// Centrifugo (their "platform" realtime), not the old Pusher app key:
//   1. POST /api/v1/realtime/connection   -> websocket url (centrifugo)
//   2. POST /api/v1/realtime/auth/connection -> short-lived JWT
//   3. WS connect {connect:{token}} then subscribe chatrooms.<chatroomId>.v2
// Messages arrive as push.pub.data.data (a JSON string).
const REALTIME_BASE = "https://web.kick.com/api/v1/realtime";
const REALTIME_HEADERS: Record<string, string> = {
  accept: "application/json",
  "content-type": "application/json",
  referer: "https://kick.com",
  "x-app-platform": "web",
  "user-agent": "Mozilla/5.0",
};

type WSLike = {
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  send(data: string): void;
  close(): void;
};
const WebSocketCtor = (globalThis as { WebSocket: new (url: string) => WSLike }).WebSocket;

type KickChannel = { id?: number; chatroom?: { id?: number } };
type KickPush = {
  push?: { channel?: string; pub?: { data?: { event?: string; data?: string } } };
};

async function resolveChatroom(slug: string): Promise<number> {
  const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
    headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Kick channel lookup failed (HTTP ${res.status})`);
  const data = (await res.json()) as KickChannel;
  const chatroomId = data.chatroom?.id;
  if (typeof chatroomId !== "number") throw new Error("Kick chatroom id not found");
  return chatroomId;
}

async function mintConnection(): Promise<{ url: string; token: string }> {
  const clientId = randomUUID();
  const connRes = await fetch(`${REALTIME_BASE}/connection`, {
    method: "POST",
    headers: REALTIME_HEADERS,
    body: JSON.stringify({
      client: { id: clientId, type: "web" },
      capabilities: { accepted_providers: [{ provider: "pusher" }, { provider: "centrifugo" }] },
    }),
  });
  if (!connRes.ok) throw new Error(`Kick realtime/connection failed (HTTP ${connRes.status})`);
  const conn = (await connRes.json()) as {
    data?: { connections?: { credentials?: { url?: string } }[] };
  };
  const url = conn.data?.connections?.[0]?.credentials?.url;
  if (!url) throw new Error("Kick realtime websocket url not found");

  const tokRes = await fetch(`${REALTIME_BASE}/auth/connection`, {
    method: "POST",
    headers: REALTIME_HEADERS,
    body: JSON.stringify({ client_id: clientId }),
  });
  if (!tokRes.ok) throw new Error(`Kick realtime/auth failed (HTTP ${tokRes.status})`);
  const tok = (await tokRes.json()) as { data?: { token?: string } };
  const token = tok.data?.token;
  if (!token) throw new Error("Kick realtime token not found");
  return { url, token };
}

const EMOTE = /\[emote:\d+:([^\]]+)\]/g;

/** Kick chat over their Centrifugo realtime. No key required (unofficial). */
export async function connectKick(opts: ConnectOptions): Promise<SourceHandle> {
  const slug = opts.channel.replace(/^@/, "").toLowerCase();
  const chatroomId = await resolveChatroom(slug);

  let closed = false;
  let ws: WSLike | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const open = async () => {
    try {
      const { url, token } = await mintConnection();
      if (closed) return;
      const socket = new WebSocketCtor(url);
      ws = socket;
      socket.onopen = () => {
        attempt = 0;
        opts.onStatus?.("connected");
        socket.send(JSON.stringify({ connect: { token, name: "js" }, id: 1 }));
        socket.send(
          JSON.stringify({ subscribe: { channel: `chatrooms.${chatroomId}.v2`, flag: 1 }, id: 2 }),
        );
      };
      socket.onmessage = (ev) => {
        const raw = String(ev.data);
        if (raw === "{}" || raw === "") {
          socket.send("{}"); // Centrifugo ping -> pong
          return;
        }
        let frame: KickPush;
        try {
          frame = JSON.parse(raw) as KickPush;
        } catch {
          return;
        }
        const inner = frame.push?.pub?.data;
        if (inner?.event !== "App\\Events\\ChatMessageEvent" || typeof inner.data !== "string") return;
        let msg: {
          id?: string;
          content?: string;
          created_at?: string;
          sender?: { username?: string; slug?: string };
        };
        try {
          msg = JSON.parse(inner.data);
        } catch {
          return;
        }
        const text = msg.content?.replace(EMOTE, "$1");
        if (!text) return;
        opts.onComment({
          platform: "kick",
          channel: slug,
          id: msg.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          author: msg.sender?.username ?? msg.sender?.slug ?? "anonymous",
          text,
          at: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString(),
        });
      };
      socket.onerror = () => opts.onError?.(new Error("Kick websocket error"));
      socket.onclose = () => {
        if (closed) return;
        attempt += 1;
        opts.onStatus?.("reconnecting");
        retry = setTimeout(() => void open(), Math.min(1000 * 2 ** attempt, 15000));
      };
    } catch (error) {
      if (closed) return;
      opts.onError?.(error instanceof Error ? error : new Error(String(error)));
      attempt += 1;
      retry = setTimeout(() => void open(), Math.min(1000 * 2 ** attempt, 15000));
    }
  };

  await open();
  return {
    close: () => {
      closed = true;
      if (retry) clearTimeout(retry);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    },
  };
}
