export const QUERY_MIN_LEN = 1;
export const QUERY_MAX_LEN = 500;
export const ITER_MIN = 1;
export const ITER_MAX = 4;
export const ITER_DEFAULT = 3;
export const DEMO_SUFFIX = "__DEMO__";

export type ParsedResearchRequest =
  | { ok: true; query: string; maxIterations: number }
  | { ok: false; error: string; status: number };

function stripDemoMarker(query: string): string {
  return query.split(DEMO_SUFFIX).join("").trim();
}

export function parseResearchRequest(body: unknown): ParsedResearchRequest {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "JSON object required", status: 400 };
  }

  const rec = body as Record<string, unknown>;

  if (typeof rec.query !== "string") {
    return { ok: false, error: "Query is required", status: 400 };
  }

  const query = rec.query.trim();
  if (query.length < QUERY_MIN_LEN) {
    return { ok: false, error: "Query is required", status: 400 };
  }
  if (query.length > QUERY_MAX_LEN) {
    return {
      ok: false,
      error: `Query must be at most ${QUERY_MAX_LEN} characters`,
      status: 400,
    };
  }
  if (stripDemoMarker(query).length < QUERY_MIN_LEN) {
    return { ok: false, error: "Query is required", status: 400 };
  }

  let maxIterations = ITER_DEFAULT;
  if (rec.maxIterations !== undefined && rec.maxIterations !== null) {
    if (typeof rec.maxIterations !== "number" || !Number.isInteger(rec.maxIterations)) {
      return { ok: false, error: "maxIterations must be an integer", status: 400 };
    }
    if (rec.maxIterations < ITER_MIN || rec.maxIterations > ITER_MAX) {
      return {
        ok: false,
        error: `maxIterations must be between ${ITER_MIN} and ${ITER_MAX}`,
        status: 400,
      };
    }
    maxIterations = rec.maxIterations;
  }

  return { ok: true, query, maxIterations };
}
