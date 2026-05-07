import { describe, it, expect } from "vitest";
import { parseTags } from "../../../server/indexer/tags.js";

describe("parseTags", () => {
  it("extracts inline tags", () => {
    const tags = parseTags("Some text #hello and #world here.");
    expect(tags).toEqual([
      { tag: "hello", lineNumber: 1 },
      { tag: "world", lineNumber: 1 },
    ]);
  });

  it("extracts nested tags", () => {
    const tags = parseTags("Topic #project/backend for work.");
    expect(tags).toEqual([{ tag: "project/backend", lineNumber: 1 }]);
  });

  it("ignores tags in code blocks", () => {
    const tags = parseTags("```\n#not-a-tag\n```\n#real-tag");
    expect(tags).toEqual([{ tag: "real-tag", lineNumber: 4 }]);
  });

  it("ignores tags in inline code", () => {
    const tags = parseTags("Use `#not-a-tag` but #real-tag");
    expect(tags).toEqual([{ tag: "real-tag", lineNumber: 1 }]);
  });

  it("ignores headings", () => {
    const tags = parseTags("# Heading\n## Another\n#actual-tag");
    expect(tags).toEqual([{ tag: "actual-tag", lineNumber: 3 }]);
  });

  it("extracts frontmatter tags in array format", () => {
    const tags = parseTags("---\ntags: [hello, world]\n---\nContent here.");
    expect(tags).toEqual([
      { tag: "hello", lineNumber: 2 },
      { tag: "world", lineNumber: 2 },
    ]);
  });

  it("extracts frontmatter tags in list format", () => {
    const tags = parseTags("---\ntags:\n  - alpha\n  - beta\n---\nContent.");
    expect(tags).toEqual([
      { tag: "alpha", lineNumber: 3 },
      { tag: "beta", lineNumber: 4 },
    ]);
  });
});
