import { URL } from "node:url";

export function createRouter() {
  const routes = [];

  function addRoute(method, path, handler) {
    routes.push({ method, path, handler });
  }

  async function handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    for (const route of routes) {
      if (req.method !== route.method) continue;

      if (typeof route.path === "string" && route.path === pathname) {
        return route.handler(req, res, url);
      }

      if (route.path instanceof RegExp) {
        const match = pathname.match(route.path);
        if (match) {
          req.params = match.groups || {};
          return route.handler(req, res, url);
        }
      }
    }

    return null;
  }

  return { get: (p, h) => addRoute("GET", p, h), put: (p, h) => addRoute("PUT", p, h), post: (p, h) => addRoute("POST", p, h), delete: (p, h) => addRoute("DELETE", p, h), handle };
}

export function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

export async function readBody(req, maxBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }));
        req.destroy();
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      // Empty body is valid for DELETE and other requests that carry no payload
      if (!raw || !raw.trim()) return resolve({});
      resolve(JSON.parse(raw));
    });
    req.on("error", reject);
  });
}
