import { describe, it, expect } from "vitest";
import { parseLinks, buildBacklinks } from "../../../server/indexer/links.js";

describe("parseLinks", () => {
  it("extracts basic wikilinks", () => {
    const links = parseLinks("Check out [[My Note]] for more.");
    expect(links).toEqual([{ target: "My Note", alias: null, lineNumber: 1 }]);
  });

  it("extracts aliased wikilinks", () => {
    const links = parseLinks("See [[My Note|this note]] here.");
    expect(links).toEqual([{ target: "My Note", alias: "this note", lineNumber: 1 }]);
  });

  it("extracts multiple links on different lines", () => {
    const links = parseLinks("Link to [[A]]\nAnd [[B]] and [[C|see C]]");
    expect(links).toHaveLength(3);
    expect(links[0]).toEqual({ target: "A", alias: null, lineNumber: 1 });
    expect(links[1]).toEqual({ target: "B", alias: null, lineNumber: 2 });
    expect(links[2]).toEqual({ target: "C", alias: "see C", lineNumber: 2 });
  });

  it("ignores links inside code blocks", () => {
    const links = parseLinks("```\n[[not a link]]\n```\n[[real link]]");
    expect(links).toEqual([{ target: "real link", alias: null, lineNumber: 4 }]);
  });

  it("ignores links inside inline code", () => {
    const links = parseLinks("This `[[not a link]]` is code. But [[real]] is not.");
    expect(links).toEqual([{ target: "real", alias: null, lineNumber: 1 }]);
  });

  it("handles section anchors", () => {
    const links = parseLinks("See [[Note#Section]]");
    expect(links).toEqual([{ target: "Note", alias: null, lineNumber: 1 }]);
  });
});

describe("buildBacklinks", () => {
  it("builds reverse link map", () => {
    const forwardLinks = new Map([
      ["a.md", [{ target: "B", alias: null, lineNumber: 1 }]],
      ["c.md", [{ target: "B", alias: null, lineNumber: 3 }, { target: "A", alias: null, lineNumber: 5 }]],
    ]);
    const fileIndex = new Map([["a", ["a.md"]], ["b", ["b.md"]], ["c", ["c.md"]]]);
    const backlinks = buildBacklinks(forwardLinks, fileIndex);
    expect(backlinks.get("b.md")).toHaveLength(2);
    expect(backlinks.get("a.md")).toHaveLength(1);
  });
});
