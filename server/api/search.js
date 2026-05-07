import { json } from "../router.js";

export function registerSearchRoutes(router, indexer) {
  router.get("/api/search", (_req, res, url) => {
    const query = url.searchParams.get("q");
    if (!query) return json(res, { error: "q required" }, 400);
    const results = indexer.search(query);
    json(res, results);
  });
}
