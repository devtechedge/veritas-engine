# Security Assessment - Veritas Engine

**Date:** 2026-09-06  
**Scope:** Auth, XSS, CORS/origin, secrets, LLM keys, SSE, rate limits, CSP  
**Context:** Public demo on Vercel (veritas-engine-woad.vercel.app). Simulated mode is default. Real provider spend requires LIVE_MODE=true AND keys (optional PUBLIC_RUN_TOKEN).

---

## Executive summary

| Area | Risk | Notes |
|------|------|--------|
| Authentication | None (accepted) | No accounts. Anyone can launch a simulated brief. |
| Authorization | N/A | HITL Approve is UX, not an ACL. |
| XSS | Low-medium | react-markdown; no dangerouslySetInnerHTML. CSP + frame deny. |
| SQL | Low | Query capped 1-500 chars; maxIterations 1-4. |
| Secrets in repo | Low | .env* gitignored; .env.example placeholders only. |
| Tool egress | Accepted (demo) | Live fetch only when live gate passes. |
| Prompt risk | Accepted (demo) | Live mode feeds retrieved text to the LLM. |
| Origin | Mitigated | Expensive routes reject cross-origin Origin/Referer. |
| Rate limit | Mitigated | In-memory ~10/min/IP on run, research. |
| Live spend | Mitigated | Need LIVE_MODE=true (+ optional x-run-token). Keys alone are not enough. |

Overall (public demo): Not unhackable while public + unauthenticated spend could be turned on - but casual abuse, framing, secret leak via git, and open LLM burn are blocked by defaults.
Overall (production product): High - no auth, no tenant isolation.

Do not claim NextAuth/JWT/multi-tenant hardening. Intent: portfolio public, then private repos.

---

## 1. Authentication

None. /api/research POST is same-origin + rate-limited.

---

## 2. Live provider gate (2026-09-06)

| Condition | Behavior |
|-----------|----------|
| LIVE_MODE unset/false | Always simulated (even if Vercel has keys) |
| LIVE_MODE=true + keys | Live providers allowed |
| PUBLIC_RUN_TOKEN set | Live only if x-run-token matches; else simulated |

Client flags cannot force live spend.

---

## 3. HTTP hardening (2026-09-06)

Headers in next.config.js: X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy camera=()/microphone=()/geolocation=(), CSP (default-src self; script/style unsafe-inline for Next; no unsafe-eval; frame-ancestors none; object-src none; base-uri/form-action self).

Guards in src/lib/security/http.ts: same-origin + 10/min/IP.

---

## 4. HITL

awaiting_approval is UX, not ACL. Approve route is still origin-checked and rate-limited.

---

## 5. XSS

React text + react-markdown. Framing denied.

---

## 6. Input validation

Drizzle only. Brief length cap. Calculator charset allow-list (unit-tested).

---

## 7. Secrets

Optional GEMINI_API_KEY / TAVILY_API_KEY behind LIVE_MODE / PUBLIC_RUN_TOKEN. Errors truncated; keys never returned.

---

## 8. Tool egress

Only when live gate passes. Accepted for demo; production needs URL allow-lists.

---

## 9. Agent budget

maxIterations capped at 4; Demo suffix still honored when live is allowed.

---

## 10. HTTP surface

See route table in repo README. Guarded: /api/research POST, research.

## 11. Supply chain
Dependabot patch/minor only.
## 12. Notes
Public demo defaults to simulated.
Enable live only with LIVE_MODE env flag.
Portfolio demos stay public for now.
## 13. Re-test
See package.json scripts for verification.
