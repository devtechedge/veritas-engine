import { describe, expect, it } from "vitest";
import { demoCritic, demoPlan, isDemoQuery, stripDemoSuffix } from "./demo";

describe("demo helpers", () => {
  it("detects and strips the demo suffix", () => {
    expect(isDemoQuery("Next.js edge __DEMO__")).toBe(true);
    expect(isDemoQuery("Next.js edge")).toBe(false);
    expect(stripDemoSuffix("Next.js edge __DEMO__")).toBe("Next.js edge");
  });

  it("builds three search objectives from the cleaned query", () => {
    const plan = demoPlan("LangGraph.js __DEMO__");
    expect(plan).toHaveLength(3);
    expect(plan.every((item) => item.includes("LangGraph.js"))).toBe(true);
  });

  it("simulates a failing first critic pass then a passing retry", () => {
    expect(demoCritic(0).score).toBe(5);
    expect(demoCritic(1).score).toBe(9);
  });
});
