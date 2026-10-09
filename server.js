// Minimal static file server for ScamShield. No dependencies.
// It serves the files in /public and nothing else. It never receives user input
// (no API routes, no request bodies) and it does not log request details.

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const HEADERS = {
  // The page may only load its own files and may not make any network connections.
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-cache",
};

export function createServer() {
  return http.createServer(async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { ...HEADERS, Allow: "GET, HEAD" });
      return res.end("Method not allowed");
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const rel = pathname === "/" ? "/index.html" : pathname;
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT + path.sep)) {
        res.writeHead(403, HEADERS);
        return res.end("Forbidden");
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error("not a file");
      const body = await readFile(file);
      res.writeHead(200, { ...HEADERS, "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404, { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" });
      res.end("Page not found");
    }
  });
}

// Start only when run directly (not when imported by tests).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 5173;
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`ScamShield is running at http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.");
  });
}
