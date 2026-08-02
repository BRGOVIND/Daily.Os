import { describe, it, expect } from "vitest";
import { parseMentions, tokenizeComment } from "./comments";

describe("parseMentions", () => {
  it("extracts distinct, lowercased mentions", () => {
    expect(parseMentions("hey @Alice and @bob, ping @alice again")).toEqual(["alice", "bob"]);
  });
  it("returns [] when there are no mentions", () => {
    expect(parseMentions("just a plain comment")).toEqual([]);
  });
});

describe("tokenizeComment", () => {
  it("splits text and mention tokens in order", () => {
    const tokens = tokenizeComment("hi @bob!");
    expect(tokens).toEqual([
      { type: "text", value: "hi " },
      { type: "mention", value: "@bob" },
      { type: "text", value: "!" },
    ]);
  });
  it("round-trips the original body", () => {
    const body = "a @b c @d";
    expect(tokenizeComment(body).map((t) => t.value).join("")).toBe(body);
  });
});
