import { describe, expect, it } from "vitest";
import { CRITIC_PASS_SCORE, nextAfterCritic } from "./routing";

describe("nextAfterCritic", () => {
  it("routes to synthesizer when the critic passes", () => {
    expect(nextAfterCritic(CRITIC_PASS_SCORE, 1, 3)).toBe("synthesizer");
    expect(nextAfterCritic(10, 1, 3)).toBe("synthesizer");
  });

  it("routes to synthesizer when iteration depth is exhausted", () => {
    expect(nextAfterCritic(5, 2, 2)).toBe("synthesizer");
    expect(nextAfterCritic(7, 4, 4)).toBe("synthesizer");
  });

  it("loops to the planner while score is below 8 and depth remains", () => {
    expect(nextAfterCritic(5, 1, 2)).toBe("planner");
    expect(nextAfterCritic(7, 1, 3)).toBe("planner");
  });
});
