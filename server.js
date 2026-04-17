const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const createArionPayInvoice = require("./api/create-arionpay-invoice");
const arionPayWebhook = require("./api/arionpay-webhook");
const createBankTransferOrder = require("./api/create-bank-transfer-order");
const contactHandler = require("./api/contact");

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

const PUBLIC_FILES = new Set([
  "/",
  "/index.html",
  "/shop.html",
  "/product.html",
  "/coa.html",
  "/faq.html",
  "/contact.html",
  "/cart.html",
  "/checkout.html",
  "/privacy.html",
  "/terms.html",
  "/shipping.html",
  "/refunds.html",
  "/style.css",
  "/enhancements.css",
  "/script.js",
  "/enhancements.js",
  "/favicon.ico"
]);

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

function createResponseAdapter(res) {
  return {
    statusCode: 200,
    headersSent: false,
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      if (this.headersSent) {
        return this;
      }

      const body = JSON.stringify(payload);
      res.writeHead(this.statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
      this.headersSent = true;
      return this;
    }
  };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", reject);
  });
}

async function handleApiRoute(handler, req, res) {
  const rawBody = await readRequestBody(req);
  let parsedBody = {};

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = {};
    }
  }

  const request = {
    method: req.method,
    headers: req.headers,
    body: parsedBody,
    rawBody
  };

  const response = createResponseAdapter(res);
  await handler(request, response);
}

function resolveStaticPath(urlPath) {
  const normalized = urlPath === "/" ? "/index.html" : urlPath;
  const segments = normalized.split("/").filter(Boolean);

  const isPublicAsset = normalized.startsWith("/assets/");
  const isPublicFile = PUBLIC_FILES.has(normalized);
  const containsHiddenSegment = segments.some((segment) => segment.startsWith("."));

  if ((!isPublicAsset && !isPublicFile) || containsHiddenSegment || normalized.startsWith("/api/") || normalized === "/api") {
    return null;
  }

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
    if (pathname === "/api/create-arionpay-invoice") {
      await handleApiRoute(createArionPayInvoice, req, res);
      return;
    }

    if (pathname === "/api/arionpay-webhook") {
      await handleApiRoute(arionPayWebhook, req, res);
      return;
    }

    if (pathname === "/api/create-bank-transfer-order") {
      await handleApiRoute(createBankTransferOrder, req, res);
      return;
    }

    if (pathname === "/api/contact") {
      await handleApiRoute(contactHandler, req, res);
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
