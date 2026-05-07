import { describe, it, expect } from "vitest";
import { resolveSafe, isInsideVault, normalizePath } from "../../../server/utils/paths.js";

describe("normalizePath", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizePath("foo\\bar\\baz.md")).toBe("foo/bar/baz.md");
  });

  it("removes leading slashes", () => {
    expect(normalizePath("/foo/bar.md")).toBe("foo/bar.md");
  });

  it("strips null bytes", () => {
    expect(normalizePath("foo\0bar.md")).toBe("foobar.md");
  });
});

describe("isInsideVault", () => {
  const vault = "/data/vault";

  it("accepts paths inside vault", () => {
    expect(isInsideVault(vault, "notes/hello.md")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isInsideVault(vault, "../etc/passwd")).toBe(false);
  });

  it("rejects double-dot in middle", () => {
    expect(isInsideVault(vault, "notes/../../etc/passwd")).toBe(false);
  });

  it("accepts vault root", () => {
    expect(isInsideVault(vault, "")).toBe(true);
    expect(isInsideVault(vault, ".")).toBe(true);
  });
});

describe("resolveSafe", () => {
  const vault = "/data/vault";

  it("resolves a simple path", () => {
    expect(resolveSafe(vault, "notes/hello.md")).toBe("/data/vault/notes/hello.md");
  });

  it("throws on path traversal", () => {
    expect(() => resolveSafe(vault, "../etc/passwd")).toThrow();
  });
});
