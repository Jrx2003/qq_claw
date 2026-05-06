# Deployment Status

## Durable Public URL

Vercel production:

- Home: `https://qqclaw.vercel.app/`
- 无 LLM 评审模式: `https://qqclaw.vercel.app/judge`
- 真实 LLM 工作台: `https://qqclaw.vercel.app/studio?key=local-studio`
- 真实 LLM 工作台访问密钥: `local-studio`
- Health check: `https://qqclaw.vercel.app/api/health`

Latest verified production deployment on 2026-05-06:

- Deployment id: `dpl_92nWWsUXLVsMRvsJ4vGhraJyT91E`
- Alias: `https://qqclaw.vercel.app`
- `/` returns HTTP 200 and includes the looping product showcase.
- `/judge` returns HTTP 200.
- `/generated/qq-bbq-memory.png` returns HTTP 200 and serves the generated BBQ memory asset.
- `/recording` returns HTTP 404 because Recording Mode has been removed.
- `/studio` returns HTTP 200 with access-key guard.
- `/studio?key=local-studio` returns HTTP 200 with free-input live LLM chat controls.
- `/studio?key=local-studio&runtime=live` with `周六有人吃火锅吗？` returns live DeepSeek JSON with `fallbackUsed: false`, `card_draft.title: "周六火锅局 · 先确认去不去"`, and the visible first-round card does not mix time/place vote options.
- `/studio?key=local-studio&runtime=live` with `周六有人吃烤肉吗？` returns live DeepSeek JSON with `fallbackUsed: false`, `card_draft.title: "周六烤肉局 · 先确认去不去"`, and the visible first-round card does not mix time/place vote options.
- In `/studio?key=local-studio&runtime=live`, after `周六有人吃火锅吗？`, free input `继续时间投票` returns live DeepSeek JSON with `fallbackUsed: false` and the visible last card is a `周六火锅局` time vote card, not another attendance card.
- In `/studio?key=local-studio&runtime=live`, after `周六有人吃火锅吗？`, free input `我可以去` records attendance and advances to a `周六火锅局` time vote card; then `继续地点投票` advances to a `周六火锅局` place vote card, both with `fallbackUsed: false`.
- In `/studio?key=local-studio&runtime=live`, after joining `周六火锅局`, repeated free input `周六晚上八点呢？`, `周六晚上九点也可以吗？`, and `再晚一点呢？` stays in the time-vote card tool, preserves the exact user supplied options `周六晚上八点`, `周六晚上九点`, and `晚一点`, and only moves to the place-vote card after explicit `继续地点投票`.
- In the same live run, NPC replies no longer all mechanically agree with each proposed time; the verified responses include disagreement and constraints such as `太晚了`, `六点就得走`, and `再晚一点是几点？`.
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
