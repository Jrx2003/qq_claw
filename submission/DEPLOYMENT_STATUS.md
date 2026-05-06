# Deployment Status

## Durable Public URL

Vercel production:

- Home: `https://qqclaw.vercel.app/`
- 无 LLM 评审模式: `https://qqclaw.vercel.app/judge`
- 真实 LLM 工作台: `https://qqclaw.vercel.app/studio?key=local-studio`
- 真实 LLM 工作台访问密钥: `local-studio`
- Health check: `https://qqclaw.vercel.app/api/health`

Latest verified production deployment on 2026-05-06:

- Deployment id: `dpl_GTt5UukAnUpxpNSHf3zuPiWn9c2r`
- Alias: `https://qqclaw.vercel.app`
- `/` returns HTTP 200 and includes the looping product showcase.
- `/judge` returns HTTP 200.
- `/generated/qq-bbq-memory.png` returns HTTP 200 and serves the generated BBQ memory asset.
- `/generated/qq-game-party.png` returns HTTP 200 and serves the 王者荣耀五排回顾 asset.
- `/recording` returns HTTP 404 because Recording Mode has been removed.
- `/studio` returns HTTP 200 with access-key guard.
- `/studio?key=local-studio` returns HTTP 200 with free-input live LLM chat controls.
- `/studio?key=local-studio&runtime=live` with `周六有人吃火锅吗？` returns live DeepSeek JSON with `fallbackUsed: false`, `card_draft.title: "周六火锅局 · 先确认去不去"`, and the visible first-round card does not mix time/place vote options.
- `/studio?key=local-studio&runtime=live` with `周六有人吃烤肉吗？` returns live DeepSeek JSON with `fallbackUsed: false`, `card_draft.title: "周六烤肉局 · 先确认去不去"`, and the visible first-round card does not mix time/place vote options.
- In `/studio?key=local-studio&runtime=live`, after `周六有人吃火锅吗？`, free input `我可以去` records attendance but does not add a time vote card; the visible bot message guides the group to propose concrete times first.
- In `/studio?key=local-studio&runtime=live`, free input `周六晚上八点呢？` then adds a `周六火锅局 · 时间投票` card with `周六晚上八点`, without falling back to static `18:30 / 19:00 / 19:30` options.
- In `/studio?key=local-studio&runtime=live`, free input `继续地点投票` either asks the group for place candidates or opens a place card only when user/NPC chat has produced concrete candidates; verified cards used chat-backed options such as `新火锅店` and `学校南门那家烤肉店`, not static `木屋烧烤 / 韩宫宴`.
- In `/studio?key=local-studio&runtime=live`, free input `寿喜烧可以吗？` opens a `周六火锅局 · 地点投票` card containing a 寿喜烧 candidate, with no static 烤肉地点 fallback.
- In `/studio?key=local-studio&runtime=live&scene=conflict_bridge`, passive chat `我只是路过看一眼，先别管我` does not duplicate the existing conflict card.
- In `/studio?key=local-studio&runtime=live&scene=game_party_hok`, spectator chat `我今天只是观战，先不打` does not duplicate the existing 王者五排 card.
- In local and production browser smoke runs, pure dinner small talk such as `今天好累啊，完全不想动` did not add any card.
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
