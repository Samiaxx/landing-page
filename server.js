const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function resolveStaticPath(urlPath) {
  const normalized = urlPath === "/" ? "/index.html" : urlPath;
  const filepath = path.join(ROOT, normalized.replace(/^\/+/, ""));
  const resolved = path.resolve(filepath);

  if (!resolved.startsWith(ROOT)) {
    return null;
  }

  return resolved;
}

function serveStatic(req, res, pathname) {
  const filepath = resolveStaticPath(pathname);

  if (!filepath || !fs.existsSync(filepath) || fs.statSync(filepath).isDirectory()) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const ext = path.extname(filepath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  fs.readFile(filepath, (error, file) => {
    if (error) {
      sendJson(res, 500, { error: "Unable to read file" });
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(file);
  });
}

const server = http.createServer(async (req, res) => {
  const currentUrl = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  const { pathname } = currentUrl;

  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    serveStatic(req, res, pathname);
  } catch (error) {
    sendJson(res, 500, {
      error: "Server error",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

server.listen(PORT, () => {
  console.log(`Primus storefront running at http://localhost:${PORT}`);
});
