import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { ZipArchive } from "archiver";
import { json } from "../router.js";
import { resolveSafe } from "../utils/paths.js";

export function registerDownloadRoutes(router, vaultRoot) {
  router.get("/api/files/download", async (req, res, url) => {
    const filePath = url.searchParams.get("path");
    if (!filePath) return json(res, { error: "path required" }, 400);

    const resolved = resolveSafe(vaultRoot, filePath);
    let stat;
    try {
      stat = await fsp.stat(resolved);
    } catch {
      return json(res, { error: "file not found" }, 404);
    }
    if (!stat.isFile()) return json(res, { error: "not a file" }, 400);

    const filename = path.basename(resolved);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": stat.size,
    });
    fs.createReadStream(resolved).pipe(res);
  });

  router.get("/api/files/download-zip", async (req, res, url) => {
    const dirPath = url.searchParams.get("path") || "";
    const resolved = resolveSafe(vaultRoot, dirPath);

    let stat;
    try {
      stat = await fsp.stat(resolved);
    } catch {
      return json(res, { error: "directory not found" }, 404);
    }
    if (!stat.isDirectory()) return json(res, { error: "not a directory" }, 400);

    const folderName = path.basename(resolved) || "vault";
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folderName}.zip"`,
    });

    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on("error", () => {
      if (!res.headersSent) json(res, { error: "zip failed" }, 500);
    });
    archive.pipe(res);
    archive.directory(resolved, folderName);
    await archive.finalize();
  });
}
