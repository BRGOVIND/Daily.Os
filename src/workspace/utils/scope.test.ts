import { describe, it, expect } from "vitest";
import { belongsTo } from "./scope";
import { DEFAULT_WORKSPACE_ID } from "@/lib/constants";

describe("belongsTo (null → default workspace)", () => {
  it("treats null/undefined as the default workspace", () => {
    expect(belongsTo(null, DEFAULT_WORKSPACE_ID)).toBe(true);
    expect(belongsTo(undefined, DEFAULT_WORKSPACE_ID)).toBe(true);
  });
  it("matches an explicit workspace id", () => {
    expect(belongsTo("ws-1", "ws-1")).toBe(true);
    expect(belongsTo("ws-1", "ws-2")).toBe(false);
  });
  it("does not leak null items into a non-default workspace", () => {
    expect(belongsTo(null, "ws-1")).toBe(false);
  });
});
