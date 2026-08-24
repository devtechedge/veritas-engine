# Security Assessment — Veritas Engine

**Date:** 2026-08-24  
**Scope:** Auth, XSS, injection, SSE API, secrets, demo mode, dependency risk  
**Context:** Public deploy is a **Next.js 14 App Router** console at [veritas-engine-woad.vercel.app](https://veritas-engine-woad.vercel.app/). Default **Demo** mode never calls Gemini or Tavily.

---

## Executive summary

| Area | Risk | Notes |
|------|------|--------|
| Authentication | **N/A (by design)** | No login, cookies, or sessions |
| Authorization | **N/A** | Single public research endpoint |
| XSS | **Low** | Custom Markdown parser emits React nodes; no `dangerouslySetInnerHTML` |
| Injection | **Low (capped)** | Query 1–500 chars; `maxIterations` 1–4; Tavily/Gemini receive the string as JSON |
| SSE / DoS | **Accepted residual** | Unauthenticated `POST /api/research` can run a LangGraph cycle |
| Secrets | **None in git** | `GEMINI_API_KEY` / `TAVILY_API_KEY` are server env only |
| AuthN of Live vs Demo | **Client flag** | `__DEMO__` suffix is client-controlled (quota preservation) |

**Overall (public Vercel demo):** Low residual risk on Demo. Live mode is opt-in and only as safe as the Gemini / Tavily keys in Vercel.

---

## 1. Authentication & session

**Findings**
- No NextAuth, JWT, cookies, or role gates.
- Demo vs Live is a UI toggle that appends `__DEMO__` to the query. The server treats that marker as “simulate,” even if keys are present.

**Verdict:** Do not claim the demo is authenticated. The suffix is **not** a secret.

---

## 2. XSS

**Findings**
- `src/components/Dashboard.tsx` parses Markdown into React elements (headings, tables, lists, `code`, `pre`). User/LLM text is passed as children, not HTML.
- No `dangerouslySetInnerHTML`. No `react-markdown`.
- Brief copy/export uses `text/markdown` blobs, not innerHTML.

**Hardening applied**
- Keep the custom parser; do not introduce raw HTML interpolation.

---

## 3. Injection (prompt / search / command)

**Findings**
- `POST /api/research` is the only mutating surface.
- Query is interpolated into Gemini system/user prompts and into Tavily’s JSON `query` field. There is no SQL, no ORM, no `child_process`.

**Hardening applied (`src/lib/validation.ts`)**
- Body must be a JSON object
- `query` must be a string, trimmed, 1–500 characters
- A body that is only `__DEMO__` is rejected
- `maxIterations` must be an integer in `[1, 4]` (default 3)

Malformed JSON returns 400.

---

## 4. HTTP surface

| Endpoint | Auth | Notes |
|----------|------|--------|
| `GET /` | None | Client dashboard |
| `POST /api/research` | None | SSE stream of LangGraph node updates |

Same-origin fetch from the dashboard. No CORS wildcards. `dynamic = "force-dynamic"`.

`next.config.js`: `typescript.ignoreBuildErrors` is **false**.

---

## 5. Secrets & demo mode

**Findings**
- `.gitignore` excludes `.env`, `.env.*`, `.vercel`. `.env.example` is empty placeholders.
- Live Gemini uses `GEMINI_API_KEY` or `GOOGLE_API_KEY` on the server. Tavily uses `TAVILY_API_KEY` in the POST body to `api.tavily.com` (Tavily’s documented key placement).
- Keys are **not** prefixed `NEXT_PUBLIC_`.
- Public Vercel can run with **no keys**: Demo mode (and a missing-key fallback) returns simulated planner / critic / brief text.

**Accepted residual risk**
- Anyone can hit `/api/research` without `__DEMO__`. If Vercel has keys, that spends quota. Demo is the documented public path.
- Tavily `api_key` in JSON is Tavily’s API, not a leak into the repo.

---

## 6. Dependency / supply chain

Runtime: Next 14, React 18, LangGraph / LangChain core, `@langchain/google-genai`, Lucide.

Removed in this pass because they were never imported: `@langchain/openai`, `clsx`, `tailwind-merge`, `zod`.

Do **not** `npm audit fix --force` onto Next 15/16 to clear Next 14 advisories. Dependabot ignores majors.

```bash
npm audit --omit=dev
```

---

## 7. Residual risk & acceptance

**Accepted for portfolio demo**
- Unauthenticated research POST
- Client-controlled Demo suffix
- Simulated briefs on Vercel
- Next 14 advisories that require a major bump

**Not accepted**
- Shipping keys in the client bundle
- Re-enabling `ignoreBuildErrors`
- Rendering LLM Markdown via `dangerouslySetInnerHTML`

---

## 8. How to re-test

```bash
npm ci
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run audit
```

To report a vulnerability, open a GitHub security advisory or an issue. Rotate Gemini / Tavily keys in the Vercel project if they leak.
