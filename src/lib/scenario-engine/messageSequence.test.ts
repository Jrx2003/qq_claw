import { describe, expect, it } from "vitest";

import type { ChatMessage } from "@/lib/types/demo";
import { nextSequencedMessages } from "./messageSequence";

function message(id: string): ChatMessage {
  return {
    id,
    actorId: "bot_xjz",
    side: "left",
    type: "text",
    text: id,
  };
}

describe("message sequencing", () => {
  it("reveals appended chat messages one at a time", () => {
    const visible = [message("seed")];
    const incoming = [message("seed"), message("one"), message("two"), message("three")];

    const firstStep = nextSequencedMessages({ visibleMessages: visible, nextMessages: incoming });
    const secondStep = nextSequencedMessages({ visibleMessages: firstStep, nextMessages: incoming });

    expect(firstStep.map((item) => item.id)).toEqual(["seed", "one"]);
    expect(secondStep.map((item) => item.id)).toEqual(["seed", "one", "two"]);
  });

  it("resets immediately when the message history is replaced instead of appended", () => {
    const visible = [message("old")];
    const incoming = [message("new")];

    expect(nextSequencedMessages({ visibleMessages: visible, nextMessages: incoming })).toEqual(incoming);
  });
});
