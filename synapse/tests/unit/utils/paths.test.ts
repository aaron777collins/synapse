import { describe, it, expect } from "vitest";
import { basename, dirname, extension, stripExtension } from "../../../src/lib/utils/paths";

describe("paths", () => {
  it("gets basename", () => { expect(basename("notes/hello.md")).toBe("hello.md"); });
  it("gets dirname", () => { expect(dirname("notes/hello.md")).toBe("notes"); });
  it("gets extension", () => { expect(extension("hello.md")).toBe("md"); });
  it("strips extension", () => { expect(stripExtension("hello.md")).toBe("hello"); });
  it("handles root files", () => { expect(dirname("hello.md")).toBe(""); expect(basename("hello.md")).toBe("hello.md"); });
});
