import { describe, expect, it } from "vitest";
import {
  ITER_DEFAULT,
  ITER_MAX,
  QUERY_MAX_LEN,
  parseResearchRequest,
} from "./validation";

describe("parseResearchRequest", () => {
  it("accepts a trimmed query and default iteration depth", () => {
    const parsed = parseResearchRequest({ query: "  Next.js edge limits  " });
    expect(parsed).toEqual({
      ok: true,
      query: "Next.js edge limits",
      maxIterations: ITER_DEFAULT,
    });
  });

  it("accepts an integer maxIterations in range", () => {
    const parsed = parseResearchRequest({ query: "LangGraph routing", maxIterations: 2 });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.maxIterations).toBe(2);
  });

  it("rejects missing or blank queries", () => {
    expect(parseResearchRequest(null).ok).toBe(false);
    expect(parseResearchRequest({}).ok).toBe(false);
    expect(parseResearchRequest({ query: "   " }).ok).toBe(false);
    expect(parseResearchRequest({ query: "__DEMO__" }).ok).toBe(false);
  });

  it("rejects queries over the length cap", () => {
    const parsed = parseResearchRequest({ query: "x".repeat(QUERY_MAX_LEN + 1) });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.status).toBe(400);
  });

  it("rejects non-integer or out-of-range maxIterations", () => {
    expect(parseResearchRequest({ query: "ok", maxIterations: 2.5 }).ok).toBe(false);
    expect(parseResearchRequest({ query: "ok", maxIterations: 0 }).ok).toBe(false);
    expect(parseResearchRequest({ query: "ok", maxIterations: ITER_MAX + 1 }).ok).toBe(false);
    expect(parseResearchRequest({ query: "ok", maxIterations: "2" }).ok).toBe(false);
  });
});
