import tmi from "tmi.js";
import type { ConnectOptions, SourceHandle } from "./types.js";

/** Twitch chat over IRC (tmi.js). Anonymous read-only — no key required. */
export async function connectTwitch(opts: ConnectOptions): Promise<SourceHandle> {
  const channel = opts.channel.replace(/^#/, "").toLowerCase();
  const client = new tmi.Client({
    connection: { reconnect: true, secure: true },
    channels: [channel],
    identity: {
      username: `justinfan${Math.floor(Math.random() * 100000)}`,
      password: "SCHMOOPIIE",
    },
  });

  client.on("message", (_chan, tags, message, self) => {
    if (self || !message) return;
    opts.onComment({
      platform: "twitch",
      channel,
      id: tags.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: tags["display-name"] ?? tags.username ?? "anonymous",
      text: message,
      at: new Date().toISOString(),
    });
  });
  client.on("connected", () => opts.onStatus?.("connected"));
  client.on("disconnected", (reason) => opts.onStatus?.("disconnected", String(reason)));
  (client as unknown as NodeJS.EventEmitter).on("error", (e: unknown) => {
    opts.onError?.(e instanceof Error ? e : new Error(String(e)));
  });

  await client.connect();
  return {
    close: () => {
      void client.disconnect().catch(() => undefined);
    },
  };
}
