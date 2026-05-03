"use client";

import { useEffect, useRef } from "react";

import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Actor, ChatMessage, DemoAction, DemoCard } from "@/lib/types/demo";

export function MessageList({
  messages,
  actors,
  cards,
  actions,
  contextLabel,
  onAction,
}: {
  messages: ChatMessage[];
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  actions: DemoAction[];
  contextLabel?: string;
  onAction: (actionId: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const actorList = Array.from(actors.values());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="phone-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          actions={actions}
          actor={actors.get(message.actorId)}
          actors={actorList}
          card={message.cardId ? cards.get(message.cardId) : undefined}
          contextLabel={contextLabel}
          key={message.id}
          message={message}
          onAction={onAction}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
