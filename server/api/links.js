import { json } from "../router.js";

export function registerLinkRoutes(router, indexer) {
  router.get("/api/links/backlinks", (_req, res, url) => {
    const filePath = url.searchParams.get("path");
    if (!filePath) return json(res, { error: "path required" }, 400);
    const backlinks = indexer.getBacklinkContext(filePath);
    json(res, backlinks);
  });

  router.get("/api/links/graph", (_req, res) => {
    const graph = indexer.getGraph();
    json(res, graph);
  });
}
