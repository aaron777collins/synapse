import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzySort } from "../../../src/lib/services/fuzzy";

describe("fuzzyMatch", () => {
  it("matches exact", () => { expect(fuzzyMatch("hello", "hello")).toBeTruthy(); });
  it("matches substring", () => { expect(fuzzyMatch("hel", "hello world")).toBeTruthy(); });
  it("matches non-contiguous characters", () => { expect(fuzzyMatch("hlo", "hello")).toBeTruthy(); });
  it("is case insensitive", () => { expect(fuzzyMatch("HEL", "hello")).toBeTruthy(); });
  it("rejects non-matching", () => { expect(fuzzyMatch("xyz", "hello")).toBeFalsy(); });
});

describe("fuzzySort", () => {
  it("ranks exact match highest", () => {
    const results = fuzzySort("app", ["apple", "application", "app"]);
    expect(results[0]).toBe("app");
  });
  it("ranks prefix match before scattered", () => {
    const results = fuzzySort("ste", ["setup", "step", "stops"]);
    expect(results[0]).toBe("step");
  });
});
