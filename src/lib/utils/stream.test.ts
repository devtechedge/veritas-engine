import { describe, expect, it } from "vitest";
import { formatSSE } from "./stream";

describe("formatSSE", () => {
  it("emits an event/data pair terminated by a blank line", () => {
    const frame = formatSSE("node_complete", { node: "planner", logs: ["ok"] });
    expect(frame.startsWith("event: node_complete\n")).toBe(true);
    expect(frame).toContain('data: {"node":"planner","logs":["ok"]}');
    expect(frame.endsWith("\n\n")).toBe(true);
  });
});
