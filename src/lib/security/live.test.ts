import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { allowLiveProviders, resolveLiveForRequest, runWithLiveGate } from "./live";

const ENV_KEYS = ["LIVE_MODE", "GEMINI_API_KEY", "GOOGLE_API_KEY", "PUBLIC_RUN_TOKEN", "TAVILY_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("resolveLiveForRequest", () => {
  it("denies live when LIVE_MODE unset", () => {
    process.env.GEMINI_API_KEY = "test";
    expect(resolveLiveForRequest(new Request("https://x/api/research", { method: "POST" }))).toBe(false);
  });

  it("allows live when LIVE_MODE=true and key present", () => {
    process.env.LIVE_MODE = "true";
    process.env.GEMINI_API_KEY = "test";
    expect(resolveLiveForRequest(new Request("https://x/api/research", { method: "POST" }))).toBe(true);
  });

  it("requires x-run-token when PUBLIC_RUN_TOKEN set", () => {
    process.env.LIVE_MODE = "true";
    process.env.GEMINI_API_KEY = "test";
    process.env.PUBLIC_RUN_TOKEN = "tok";
    expect(resolveLiveForRequest(new Request("https://x/api/research", { method: "POST" }))).toBe(false);
    const ok = new Request("https://x/api/research", {
      method: "POST",
      headers: { "x-run-token": "tok" },
    });
    expect(resolveLiveForRequest(ok)).toBe(true);
  });
});

describe("runWithLiveGate", () => {
  it("scopes allowLiveProviders", () => {
    process.env.LIVE_MODE = "true";
    process.env.GEMINI_API_KEY = "test";
    runWithLiveGate(false, () => expect(allowLiveProviders()).toBe(false));
    runWithLiveGate(true, () => expect(allowLiveProviders()).toBe(true));
  });
});
