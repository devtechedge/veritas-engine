export const CRITIC_PASS_SCORE = 8;

export type CriticRoute = "synthesizer" | "planner";

export function nextAfterCritic(
  score: number,
  iterations: number,
  maxIterations: number
): CriticRoute {
  if (score >= CRITIC_PASS_SCORE || iterations >= maxIterations) {
    return "synthesizer";
  }
  return "planner";
}
