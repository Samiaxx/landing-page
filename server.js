const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const createNowPaymentsPayment = require("./api/create-nowpayments-payment");
const getNowPaymentsPayment = require("./api/get-nowpayments-payment");
const refreshNowPaymentsPayment = require("./api/refresh-nowpayments-payment");

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

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(ROOT, ".env"));
loadEnvFile(path.join(ROOT, ".env.local"));

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
    if (pathname === "/api/create-nowpayments-payment") {
      await createNowPaymentsPayment(req, res);
      return;
    }

    if (pathname === "/api/get-nowpayments-payment") {
      await getNowPaymentsPayment(req, res);
      return;
    }

    if (pathname === "/api/refresh-nowpayments-payment") {
      await refreshNowPaymentsPayment(req, res);
      return;
    }

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
