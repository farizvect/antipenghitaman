import type { ConnectOptions, Platform, SourceHandle } from "./types.js";
import { connectTwitch } from "./twitch.js";
import { connectKick } from "./kick.js";
import { connectYouTube } from "./youtube.js";
import { connectTikTok } from "./tiktok.js";

/** One adapter per platform: (options) => SourceHandle. */
export const connectors: Record<Platform, (opts: ConnectOptions) => Promise<SourceHandle>> = {
  twitch: connectTwitch,
  kick: connectKick,
  youtube: connectYouTube,
  tiktok: connectTikTok,
};

export function isPlatform(value: string): value is Platform {
  return Object.prototype.hasOwnProperty.call(connectors, value);
}

export async function connectSource(
  platform: string,
  opts: ConnectOptions,
): Promise<SourceHandle> {
  if (!isPlatform(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return connectors[platform](opts);
}

export * from "./types.js";
