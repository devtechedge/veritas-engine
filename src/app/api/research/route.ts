import { NextRequest } from "next/server";
import { graph } from "@/lib/agents/graph";
import { formatSSE } from "@/lib/utils/stream";
import { parseResearchRequest } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON object required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = parseResearchRequest(body);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: parsed.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { query, maxIterations } = parsed;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (event: string, payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(formatSSE(event, payload)));
      };

      try {
        sendUpdate("agent_start", { message: "Initializing Multi-Agent Veritas-Engine..." });

        const graphInput = {
          userQuery: query,
          maxIterations,
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
          const nodeOutput = (update as Record<string, Record<string, unknown>>)[nodeName];

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Execution exception occurred.";
        sendUpdate("agent_error", { error: message });
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
