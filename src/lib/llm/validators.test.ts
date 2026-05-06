import { describe, expect, it } from "vitest";

import { getFallbackForTask } from "./fallback";
import { validateLlmTaskData } from "./validators";

describe("LLM validators and fallback", () => {
  it("validates structured intent extraction output with zod", () => {
    const data = getFallbackForTask("intent");
    const parsed = validateLlmTaskData("intent", data);

    expect(parsed.should_intervene).toBe(true);
    expect(parsed.intent_type).toBe("plan");
    expect(parsed.chips).toContain("可以，先确认去不去");
  });

  it("rejects malformed live output before it can reach the UI", () => {
    expect(() =>
      validateLlmTaskData("anonymous", {
        title: "匿名倡议",
        group_message: "有人想周五聚一下。",
      }),
    ).toThrow();
  });

  it("has fixture fallback data for every required live task", () => {
    for (const task of ["intent", "anonymous", "conflict", "recap", "game-recap", "studio-conversation"] as const) {
      expect(validateLlmTaskData(task, getFallbackForTask(task))).toBeTruthy();
    }
  });
});
