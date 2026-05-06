# Deployment Status

## Durable Public URL

Vercel production:

- Home: `https://qqclaw.vercel.app/`
- 无 LLM 评审模式: `https://qqclaw.vercel.app/judge`
- 真实 LLM 工作台: `https://qqclaw.vercel.app/studio?key=local-studio`
- 真实 LLM 工作台访问密钥: `local-studio`
- Health check: `https://qqclaw.vercel.app/api/health`

Latest verified production deployment on 2026-05-06:

- Deployment id: `dpl_BcCyoBDeiMdSeGUaDcFAj7cRXpxz`
- Alias: `https://qqclaw.vercel.app`
- `/` returns HTTP 200 and includes the looping product showcase.
- `/judge` returns HTTP 200.
- `/generated/qq-bbq-memory.png` returns HTTP 200 and serves the generated BBQ memory asset.
- `/recording` returns HTTP 404 because Recording Mode has been removed.
- `/studio` returns HTTP 200 with access-key guard.
- `/studio?key=local-studio` returns HTTP 200 with free-input live LLM chat controls.
- `/api/health` returns `{ "ok": true, "defaultMode": "judge", "llmRuntimeMode": "snapshot" }`.
- `/api/llm/anonymous` with `mode: "snapshot"` returns schema-validated snapshot JSON.
- `/api/llm/intent`, `/api/llm/anonymous`, `/api/llm/conflict`, `/api/llm/recap`, `/api/llm/game-recap`, and `/api/llm/studio-conversation` with `mode: "live"` return schema-validated DeepSeek JSON with `fallbackUsed: false`.

## Runtime Policy

- `/judge` defaults to `snapshot` runtime for stable judging without live model variance.
- `/studio` defaults to `live` runtime for free-input chat, model-driven NPC replies, and function suggestions.
- Live LLM secrets are only configured in Vercel server-side environment variables.
- The included `vercel.json` traces `prompts/live_llm/**/*` and `fixtures/snapshots/**/*` into API route bundles so serverless LLM routes can read prompt and fallback assets.

## Temporary Tunnel Note

A Cloudflare quick tunnel was used during local smoke testing, but it is no longer the primary submission URL. Use the Vercel production URL above for judging.
