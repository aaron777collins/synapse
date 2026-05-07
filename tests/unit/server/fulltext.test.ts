import { describe, it, expect } from "vitest";
import { tokenize, buildFullTextIndex, searchIndex } from "../../../server/indexer/fulltext.js";

describe("tokenize", () => {
  it("lowercases and splits on non-alpha", () => {
    expect(tokenize("Hello World")).toEqual(["hello", "world"]);
  });

  it("filters stop words", () => {
    const tokens = tokenize("the quick brown fox and the lazy dog");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("and");
    expect(tokens).toContain("quick");
  });

  it("filters short tokens", () => {
    const tokens = tokenize("I am a big person");
    expect(tokens).not.toContain("i");
    expect(tokens).not.toContain("am");
    expect(tokens).not.toContain("a");
    expect(tokens).toContain("big");
    expect(tokens).toContain("person");
  });
});

describe("searchIndex", () => {
  it("returns matching files ranked by hits", () => {
    const files = new Map([
      ["a.md", "hello world hello again"],
      ["b.md", "hello there"],
      ["c.md", "goodbye world"],
    ]);
    const index = buildFullTextIndex(files);
    const results = searchIndex(index, "hello", files);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].path).toBe("a.md");
  });

  it("returns empty for no match", () => {
    const files = new Map([["a.md", "hello world"]]);
    const index = buildFullTextIndex(files);
    const results = searchIndex(index, "zzzznotfound", files);
    expect(results).toEqual([]);
  });
});
