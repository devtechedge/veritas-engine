import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export interface SearchResult {
  query: string;
  results: string[];
}

export const VeritasState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userQuery: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  plan: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  queries: Annotation<string[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  }),
  searchResults: Annotation<SearchResult[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  }),
  criticScore: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  criticFeedback: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  synthesizedOutput: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  iterations: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 3,
  }),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  })
});