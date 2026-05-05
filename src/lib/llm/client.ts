import { promises as fs } from "fs";
import path from "path";

import type { LlmTaskConfig } from "@/lib/llm/mapping";

type ProviderConfig = {
  provider: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

export type LiveLlmCallResult = {
  data: unknown;
  meta: {
    provider: string;
    model: string;
    latencyMs: number;
  };
};

export async function callLiveStructuredLlm({
  config,
  input,
}: {
  config: LlmTaskConfig;
  input: unknown;
}): Promise<LiveLlmCallResult> {
  const provider = resolveProviderConfig();

  if (!provider.apiKey) {
    throw new Error(`Missing API key for provider "${provider.provider}".`);
  }

  const prompt = await fs.readFile(path.join(process.cwd(), config.promptFile), "utf8");
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);

  try {
    const providerBody = resolveProviderBody(provider.model);
    const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: providerBody.model,
        temperature: providerBody.temperature,
        response_format: { type: "json_object" },
        ...providerBody.extraBody,
        messages: [
          {
            role: "system",
            content: [
              prompt,
              "你必须只输出一个 JSON object，不要输出 Markdown。",
              `输出必须符合这个 JSON Schema: ${JSON.stringify(config.schema)}`,
            ].join("\n\n"),
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Provider returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Provider response did not include message content.");
    }

    return {
      data: parseJsonObject(content),
      meta: {
        provider: provider.provider,
        model: provider.model,
        latencyMs: Date.now() - startedAt,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function resolveProviderBody(model: string) {
  const normalized = model.trim().toLowerCase();

  if (normalized.startsWith("kimi-k2.") && normalized.endsWith("-thinking")) {
    return {
      model: normalized.replace(/-thinking$/, ""),
      temperature: 1.0,
      extraBody: {
        thinking: {
          type: "enabled",
        },
      },
    };
  }

  if (normalized.startsWith("kimi-k2.")) {
    return {
      model: normalized,
      temperature: 0.6,
      extraBody: {
        thinking: {
          type: "disabled",
        },
      },
    };
  }

  return {
    model,
    temperature: 0.3,
    extraBody: {},
  };
}

function resolveProviderConfig(): ProviderConfig {
  const provider = process.env.LLM_PROVIDER ?? "openai-compatible";
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? "12000");

  if (provider === "kimi") {
    return {
      provider,
      apiKey: process.env.KIMI_API_KEY ?? process.env.OPENAI_API_KEY,
      baseUrl: process.env.KIMI_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.moonshot.cn/v1",
      model: process.env.OPENAI_MODEL ?? process.env.KIMI_MODEL ?? "kimi-k2.5",
      timeoutMs,
    };
  }

  if (provider === "deepseek") {
    return {
      provider,
      apiKey: process.env.DEEPSEEK_API_KEY ?? process.env.OPENAI_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.deepseek.com",
      model: process.env.OPENAI_MODEL ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      timeoutMs,
    };
  }

  return {
    provider,
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    timeoutMs,
  };
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Provider output was not parseable JSON.");
    }

    return JSON.parse(match[0]);
  }
}
