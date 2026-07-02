import { StateGraph, START, END } from "@langchain/langgraph";
import { VeritasState } from "./state";
import { plannerNode, searchNode, criticNode, synthesizerNode } from "./nodes";

const workflow = new StateGraph(VeritasState)
  .addNode("planner", plannerNode)
  .addNode("search", searchNode)
  .addNode("critic", criticNode)
  .addNode("synthesizer", synthesizerNode)
  .addEdge(START, "planner")
  .addEdge("planner", "search")
  .addEdge("search", "critic")
  .addConditionalEdges("critic", (state) => {
    const score = state.criticScore;
    const count = state.iterations;
    const max = state.maxIterations;

    if (score >= 8 || count >= max) {
      return "synthesizer";
    }
    return "planner";
  })
  .addEdge("synthesizer", END);

export const graph = workflow.compile();