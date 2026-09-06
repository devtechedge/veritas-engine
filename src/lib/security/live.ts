import { AsyncLocalStorage } from "node:async_hooks";

type LiveStore = { allowLive: boolean };
const als = new AsyncLocalStorage<LiveStore>();

function envLiveFlag(): boolean {
  return (process.env.LIVE_MODE ?? "").trim().toLowerCase() === "true";
}

export function hasGeminiKey(): boolean {
  return Boolean((process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "").trim());
}

export function hasTavilyKey(): boolean {
  return Boolean((process.env.TAVILY_API_KEY ?? "").trim());
}

export function allowLiveProviders(): boolean {
  const store = als.getStore();
  if (store) return store.allowLive;
  return envLiveFlag() && hasGeminiKey();
}

export function resolveLiveForRequest(req: Request): boolean {
  if (!envLiveFlag()) return false;
  if (!hasGeminiKey() && !hasTavilyKey()) return false;
  const token = (process.env.PUBLIC_RUN_TOKEN ?? "").trim();
  if (token) {
    const header = (req.headers.get("x-run-token") ?? "").trim();
    if (header !== token) return false;
  }
  return true;
}

export function runWithLiveGate<T>(allowLive: boolean, fn: () => T): T {
  return als.run({ allowLive }, fn);
}

export async function runWithLiveGateAsync<T>(allowLive: boolean, fn: () => Promise<T>): Promise<T> {
  return als.run({ allowLive }, fn);
}
