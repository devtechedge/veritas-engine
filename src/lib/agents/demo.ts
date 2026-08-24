import { DEMO_SUFFIX } from "@/lib/validation";

export function isDemoQuery(query: string): boolean {
  return query.includes(DEMO_SUFFIX);
}

export function stripDemoSuffix(query: string): string {
  return query.split(DEMO_SUFFIX).join("").trim();
}

export function demoPlan(query: string): string[] {
  const q = stripDemoSuffix(query);
  return [
    `Technical implementation metrics for ${q}`,
    `Architectural benchmarks of ${q}`,
    `Security profile and edge execution cases of ${q}`,
  ];
}

export function demoSearchHits(query: string): string[] {
  const cleanQuery = stripDemoSuffix(query);
  return [
    `Mock analysis context for query "${cleanQuery}": Found relevant competitive indicators, architectural benchmarks, and system metrics from key repositories.`,
    `Synthesized industry standard data pointing to optimal runtime configurations matching "${cleanQuery}".`,
  ];
}

export function demoCritic(currentIteration: number): {
  score: number;
  feedback: string;
  log: string;
} {
  if (currentIteration === 0) {
    return {
      score: 5,
      feedback:
        "Initial retrieval contains useful foundational nodes, but lacks fine-grained architectural limits and edge validation cases. Re-evaluate queries to target low-level constraints.",
      log: "Critic Audit (Simulation): Score: 5/10. Gap analysis demands higher precision targets. Rerouting to Planner.",
    };
  }
  return {
    score: 9,
    feedback:
      "Verified deep implementation benchmarks and execution constraints. Syntactic depth qualifies criteria constraints.",
    log: "Critic Audit (Simulation): Score: 9/10. Content requirements fully matched. Synthesized output approved.",
  };
}
