import { StateGraph, START, END } from "@langchain/langgraph";
import { VeritasState } from "./state";
import { plannerNode, searchNode, criticNode, synthesizerNode } from "./nodes";
import { nextAfterCritic } from "./routing";

const workflow = new StateGraph(VeritasState)
  .addNode("planner", plannerNode)
  .addNode("search", searchNode)
  .addNode("critic", criticNode)
  .addNode("synthesizer", synthesizerNode)
  .addEdge(START, "planner")
  .addEdge("planner", "search")
  .addEdge("search", "critic")
  .addConditionalEdges("critic", (state) =>
    nextAfterCritic(state.criticScore, state.iterations, state.maxIterations)
  )
  .addEdge("synthesizer", END);

export const graph = workflow.compile();
