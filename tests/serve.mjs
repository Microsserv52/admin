import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const prefix = "/admin";
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};
createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (prefix && path !== prefix && !path.startsWith(prefix + "/"))
      throw new Error("Other zone");
    let file = resolve(
      root,
      "." + (prefix ? path.slice(prefix.length) || "/" : path),
    );
    if (file !== root && !file.startsWith(root + sep))
      throw new Error("Invalid path");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("Static test server: http://127.0.0.1:4173" + prefix + "/"),
);
