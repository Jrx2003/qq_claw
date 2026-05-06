"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { SuggestionChipBar } from "@/components/chat/SuggestionChipBar";
import { useSequencedMessages } from "@/components/chat/useSequencedMessages";
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
  cardActions,
  onAction,
  onSubmitText,
  inputDisabled,
  inputMode,
  inputPlaceholder,
}: {
  scene: SceneDefinition;
  mode: AppMode;
  messages: ChatMessage[];
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  actions: DemoAction[];
  cardActions?: DemoAction[];
  onAction: (actionId: string) => void;
  onSubmitText?: (text: string) => void;
  inputDisabled?: boolean;
  inputMode?: "guided" | "free";
  inputPlaceholder?: string;
}) {
  const visibleMessages = useSequencedMessages(messages);

  return (
    <main className="flex h-[780px] max-h-[calc(100vh-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-qq-bg shadow-soft">
      <ChatHeader mode={mode} scene={scene} />
      <MessageList
        actors={actors}
        cardActions={cardActions ?? actions}
        cards={cards}
        contextLabel={sceneContextLabel(scene)}
        messages={visibleMessages}
        onAction={onAction}
      />
      <SuggestionChipBar
        actions={actions}
        inputDisabled={inputDisabled}
        inputMode={inputMode}
        onAction={onAction}
        onSubmitText={onSubmitText}
        placeholder={inputPlaceholder}
      />
    </main>
  );
}
