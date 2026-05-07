import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRouter, json, readBody } from "./router.js";
import { listDir, readFile, writeFile, mkDir, moveFile, deleteFile } from "./api/files.js";
import { getMimeType } from "./utils/mime.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const VAULT = path.resolve(getArg("vault") || process.env.SYNAPSE_VAULT || "./vault");
const PORT = parseInt(getArg("port") || process.env.PORT || "5173", 10);
const HOST = getArg("host") || process.env.HOST || "127.0.0.1";

if (!fs.existsSync(VAULT)) {
  fs.mkdirSync(VAULT, { recursive: true });
  console.log(`Created vault directory: ${VAULT}`);
}

const router = createRouter();

router.get("/api/config", (_req, res) => {
  json(res, { name: path.basename(VAULT), version: "0.1.0" });
});

router.get("/api/health", (_req, res) => {
  json(res, { status: "ok" });
});

router.get("/api/files/list", async (req, res, url) => {
  const dir = url.searchParams.get("dir") || "";
  const entries = await listDir(VAULT, dir);
  json(res, entries);
});

router.get("/api/files/read", async (req, res, url) => {
  const filePath = url.searchParams.get("path");
  if (!filePath) return json(res, { error: "path required" }, 400);
  const result = await readFile(VAULT, filePath);
  json(res, result);
});

router.put("/api/files/write", async (req, res) => {
  const body = await readBody(req, 10 * 1024 * 1024);
  if (!body.path || body.content === undefined) return json(res, { error: "path and content required" }, 400);
  await writeFile(VAULT, body.path, body.content);
  json(res, { ok: true });
});

router.post("/api/files/mkdir", async (req, res) => {
  const body = await readBody(req);
  if (!body.path) return json(res, { error: "path required" }, 400);
  await mkDir(VAULT, body.path);
  json(res, { ok: true });
});

router.post("/api/files/move", async (req, res) => {
  const body = await readBody(req);
  if (!body.from || !body.to) return json(res, { error: "from and to required" }, 400);
  await moveFile(VAULT, body.from, body.to);
  json(res, { ok: true });
});

router.delete("/api/files/delete", async (req, res) => {
  const body = await readBody(req);
  if (!body.path) return json(res, { error: "path required" }, 400);
  await deleteFile(VAULT, body.path);
  json(res, { ok: true });
});

const DIST = path.join(ROOT, "dist");
const hasDist = fs.existsSync(DIST);
const staticRoot = hasDist ? DIST : path.join(ROOT, "public");
let indexHtml = null;

if (hasDist) {
  try {
    indexHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  } catch {}
}

const server = http.createServer(async (req, res) => {
  try {
    const result = await router.handle(req, res);
    if (result !== null) return;

    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const filePath = path.join(staticRoot, url.pathname === "/" ? "index.html" : url.pathname);
      const safeCheck = path.resolve(filePath);
      if (!safeCheck.startsWith(staticRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      try {
        await fsp.access(filePath);
        const stat = await fsp.stat(filePath);
        if (stat.isFile()) {
          res.writeHead(200, {
            "Content-Type": getMimeType(filePath),
            "Content-Length": stat.size,
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch {}

      if (indexHtml) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(indexHtml);
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    }
  } catch (err) {
    const status = err.statusCode || 500;
    json(res, { error: err.message }, status);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Synapse server: http://${HOST}:${PORT}`);
  console.log(`Vault: ${VAULT}`);
  if (hasDist) console.log(`Serving frontend from: ${DIST}`);
});

export { VAULT };
