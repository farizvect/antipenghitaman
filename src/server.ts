import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { classifyText, ConfigurationError, OpenRouterError } from "./classifier.js";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT_LENGTH = 10_000;

type JsonObject = Record<string, unknown>;

const PUBLIC_FILES: Record<string, { file: string; type: string }> = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/styles.css": { file: "styles.css", type: "text/css; charset=utf-8" },
  "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
  "/favicon.svg": { file: "favicon.svg", type: "image/svg+xml" },
};

function sendJson(response: ServerResponse, status: number, body: JsonObject): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function sendPublicFile(response: ServerResponse, pathname: string): Promise<boolean> {
  const asset = PUBLIC_FILES[pathname];
  if (!asset) return false;

  const content = await readFile(join(process.cwd(), "public", asset.file));
  response.writeHead(200, {
    "Content-Type": asset.type,
    "Cache-Control": "no-cache",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  response.end(content);
  return true;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new ClientError("Request body is too large", 413);
    }
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ClientError("Request body must be valid JSON", 400);
  }
}

class ClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && (await sendPublicFile(response, url.pathname))) {
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/classify") {
    sendJson(response, 404, { error: "Endpoint not found" });
    return;
  }

  const body = await readJson(request);
  if (typeof body !== "object" || body === null || typeof (body as JsonObject).text !== "string") {
    throw new ClientError('Field "text" must be a string', 400);
  }

  const text = (body as JsonObject).text as string;
  const rawThreshold = (body as JsonObject).threshold;
  if (text.trim().length === 0) {
    throw new ClientError('Field "text" cannot be empty', 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new ClientError(`Field "text" cannot exceed ${MAX_TEXT_LENGTH} characters`, 400);
  }
  if (
    rawThreshold !== undefined &&
    (typeof rawThreshold !== "number" || !Number.isFinite(rawThreshold) || rawThreshold < 0 || rawThreshold > 1)
  ) {
    throw new ClientError('Field "threshold" must be a number between 0 and 1', 400);
  }

  const classification = rawThreshold === undefined
    ? await classifyText(text)
    : await classifyText(text, { threshold: rawThreshold as number });
  const { negative, score, confidence } = classification;
  sendJson(response, 200, { negative, score, confidence });
}

export function createApp() {
  return createServer((request, response) => {
    handleRequest(request, response).catch((error: unknown) => {
      if (error instanceof ClientError) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      if (error instanceof ConfigurationError) {
        sendJson(response, 500, { error: "Classification service is not configured" });
        return;
      }
      if (error instanceof OpenRouterError) {
        const status = error.status >= 400 && error.status < 500 ? 502 : error.status;
        sendJson(response, status, { error: "Classification service is temporarily unavailable" });
        return;
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        sendJson(response, 504, { error: "Classification service timed out" });
        return;
      }

      console.error(error);
      sendJson(response, 500, { error: "Internal server error" });
    });
  });
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => {
    console.log(`Classification API running at http://localhost:${port}`);
  });
}
