import { NextRequest } from "next/server";
import { graph } from "@/lib/agents/graph";
import { formatSSE } from "@/lib/utils/stream";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { query, maxIterations = 3 } = await req.json();

  if (!query) {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (event: string, payload: Record<string, any>) => {
        controller.enqueue(encoder.encode(formatSSE(event, payload)));
      };

      try {
        sendUpdate("agent_start", { message: "Initializing Multi-Agent Veritas-Engine..." });

        const graphInput = {
          userQuery: query,
          maxIterations: maxIterations,
          iterations: 0,
          messages: [],
          plan: [],
          queries: [],
          searchResults: [],
          criticScore: 0,
          criticFeedback: "",
          synthesizedOutput: "",
          logs: [],
        };

        const eventStream = await graph.stream(graphInput, {
          streamMode: "updates",
        });

        for await (const update of eventStream) {
          const nodeName = Object.keys(update)[0];
          // Assert update to a Record to allow dynamic string indexing on LangGraph output
          const nodeOutput = (update as Record<string, any>)[nodeName];

          sendUpdate("node_complete", {
            node: nodeName,
            output: {
              plan: nodeOutput.plan || [],
              queries: nodeOutput.queries || [],
              criticScore: nodeOutput.criticScore || 0,
              criticFeedback: nodeOutput.criticFeedback || "",
              synthesizedOutput: nodeOutput.synthesizedOutput || "",
              logs: nodeOutput.logs || [],
            },
          });
        }

        sendUpdate("agent_end", { message: "Task complete." });
        controller.close();
      } catch (err: any) {
        sendUpdate("agent_error", { error: err.message || "Execution exception occurred." });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}