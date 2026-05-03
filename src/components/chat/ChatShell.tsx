"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { SuggestionChipBar } from "@/components/chat/SuggestionChipBar";
import { sceneContextLabel } from "@/lib/sceneMeta";
import type {
  Actor,
  AppMode,
  ChatMessage,
  DemoAction,
  DemoCard,
  SceneDefinition,
} from "@/lib/types/demo";

export function ChatShell({
  scene,
  mode,
  messages,
  actors,
  cards,
  actions,
  onAction,
}: {
  scene: SceneDefinition;
  mode: AppMode;
  messages: ChatMessage[];
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  actions: DemoAction[];
  onAction: (actionId: string) => void;
}) {
  return (
    <main className="flex h-[780px] max-h-[calc(100vh-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-qq-bg shadow-soft">
      <ChatHeader mode={mode} scene={scene} />
      <MessageList
        actions={actions}
        actors={actors}
        cards={cards}
        contextLabel={sceneContextLabel(scene)}
        messages={messages}
        onAction={onAction}
      />
      <SuggestionChipBar actions={actions} onAction={onAction} />
    </main>
  );
}
