/**
 * Terminal smoke tester for the live comment adapters.
 *   node --import tsx src/sources/cli.ts <twitch|kick|youtube|tiktok> <channel> [videoId]
 *   npm run live -- twitch monstercat
 */
import { connectSource } from "./index.js";

const [platform, channel, video] = process.argv.slice(2);
if (!platform || !channel) {
  console.error("usage: <twitch|kick|youtube|tiktok> <channel> [videoId]");
  process.exit(1);
}

const handle = await connectSource(platform, {
  channel,
  ...(video ? { video } : {}),
  onComment: (c) => console.log(`[${c.platform}#${c.channel}] ${c.author}: ${c.text}`),
  onStatus: (state, detail) => console.log(`(status) ${state}${detail ? ` ${detail}` : ""}`),
  onError: (e) => console.error(`(error) ${e.message}`),
});
console.log(`listening on ${platform}/${channel} — Ctrl-C to stop`);

const shutdown = async () => {
  await handle.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
