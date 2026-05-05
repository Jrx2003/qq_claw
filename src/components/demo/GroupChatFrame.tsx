"use client";

import { ChatShell } from "@/components/chat/ChatShell";
import type { Actor, AppMode, ChatMessage, DemoAction, DemoCard, SceneDefinition } from "@/lib/types/demo";

export function GroupChatFrame({
  actions,
  actors,
  cards,
  messages,
  mode,
  onAction,
  scene,
}: {
  actions: DemoAction[];
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  messages: ChatMessage[];
  mode: AppMode;
  onAction: (actionId: string) => void;
  scene: SceneDefinition;
}) {
  return (
    <ChatShell
      actions={actions}
      actors={actors}
      cards={cards}
      messages={messages}
      mode={mode}
      onAction={onAction}
      scene={scene}
    />
  );
}
