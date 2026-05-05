import { describe, expect, it } from "vitest";

import { buildCardButtonModels } from "./cardUtils";
import type { DemoAction } from "@/lib/types/demo";

const replayAction: DemoAction = {
  actionId: "dinner.replay",
  id: "dinner.replay",
  label: "Replay",
  kind: "toolbar",
  nextBeatId: "dinner.seed",
  nextStepId: "dinner.seed",
};

describe("buildCardButtonModels", () => {
  it("uses explicit actionId bindings and does not infer actions from labels", () => {
    const models = buildCardButtonModels(
      [
        { label: "下次再约", actionId: "missing.next_time" },
        { label: "保存回忆" },
        { label: "Replay", actionId: "dinner.replay" },
      ],
      [replayAction],
    );

    expect(models).toEqual([
      { label: "下次再约", action: undefined, disabled: true },
      { label: "保存回忆", action: undefined, disabled: true },
      { label: "Replay", action: replayAction, disabled: false },
    ]);
  });
});
