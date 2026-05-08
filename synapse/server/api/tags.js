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

  router.get("/api/tags/note", (_req, res, url) => {
    const tag = url.searchParams.get("tag");
    if (!tag) return json(res, { error: "tag required" }, 400);
    const result = indexer.getTagNote(tag);
    json(res, result);
  });

  router.get("/api/tags/search", (_req, res, url) => {
    const tagsParam = url.searchParams.get("tags");
    const mode = url.searchParams.get("mode") || "and";
    if (!tagsParam) return json(res, { error: "tags required" }, 400);
    const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    const result = indexer.searchByTags(tags, mode);
    json(res, result);
  });
}
