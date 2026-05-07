import { json } from "../router.js";

export function registerTagRoutes(router, indexer) {
  router.get("/api/tags", (_req, res) => {
    const tags = indexer.getTags();
    json(res, tags);
  });

  router.get("/api/tags/files", (_req, res, url) => {
    const tag = url.searchParams.get("tag");
    if (!tag) return json(res, { error: "tag required" }, 400);
    const files = indexer.getTagFiles(tag);
    json(res, files);
  });
}
