import { Innertube } from "youtubei.js";
import type { ConnectOptions, SourceHandle } from "./types.js";

type ChatAction = {
  type?: string;
  item?: {
    type?: string;
    id?: string;
    message?: { toString(): string };
    author?: { name?: string };
  };
};

/**
 * YouTube live chat via youtubei.js (innertube — no API key). Pass `video`
 * (a live video id) or `channel` (a @handle; resolves its /live stream).
 * Requires the stream to be live and have chat enabled.
 */
export async function connectYouTube(opts: ConnectOptions): Promise<SourceHandle> {
  const yt = await Innertube.create({ retrieve_player: false });
  const target = opts.video
    ? opts.video
    : opts.channel.startsWith("@")
      ? `https://www.youtube.com/${opts.channel}/live`
      : opts.channel;

  const info = await yt.getInfo(target);
  const chat = info.getLiveChat();
  if (!chat) throw new Error("This video has no live chat");

  chat.on("start", () => opts.onStatus?.("connected"));
  chat.on("end", () => opts.onStatus?.("ended"));
  chat.on("error", (e: unknown) => {
    opts.onError?.(e instanceof Error ? e : new Error(String(e)));
  });
  chat.on("chat-update", (action) => {
    const a = action as unknown as ChatAction;
    const item = a.item;
    if (!item || item.type !== "LiveChatTextMessage") return;
    const text = item.message?.toString?.() ?? "";
    if (!text) return;
    opts.onComment({
      platform: "youtube",
      channel: opts.channel,
      id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: item.author?.name ?? "anonymous",
      text,
      at: new Date().toISOString(),
    });
  });

  chat.start();
  try {
    chat.applyFilter("LIVE_CHAT"); // all messages, not just "Top chat"
  } catch {
    /* filter is best-effort */
  }
  return {
    close: () => {
      try {
        chat.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
