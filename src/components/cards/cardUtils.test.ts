import { describe, expect, it } from "vitest";

import { buildCardButtonModels } from "./cardUtils";
import type { DemoAction } from "@/lib/types/demo";

const replayAction: DemoAction = {
  id: "e_action_1",
  label: "Replay",
  kind: "toolbar",
  nextStepId: "scene_a_chat_seed",
};

describe("buildCardButtonModels", () => {
  it("marks fixture card buttons without matching actions as disabled", () => {
    const models = buildCardButtonModels(["下次再约", "保存回忆", "Replay"], [replayAction]);

    expect(models).toEqual([
      { label: "下次再约", action: undefined, disabled: true },
      { label: "保存回忆", action: undefined, disabled: true },
      { label: "Replay", action: replayAction, disabled: false },
    ]);
  });
});
