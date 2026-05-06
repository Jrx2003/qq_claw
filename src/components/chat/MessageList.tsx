"use client";

import { useEffect, useRef } from "react";

import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Actor, ChatMessage, DemoAction, DemoCard } from "@/lib/types/demo";

export function MessageList({
  messages,
  actors,
  cards,
  cardActions,
  contextLabel,
  onAction,
}: {
  messages: ChatMessage[];
  actors: Map<string, Actor>;
  cards: Map<string, DemoCard>;
  cardActions: DemoAction[];
  contextLabel?: string;
  onAction: (actionId: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const actorList = Array.from(actors.values());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    const settledScroll = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 420);

    return () => window.clearTimeout(settledScroll);
  }, [messages.length]);

  return (
    <div className="phone-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          actor={actors.get(message.actorId)}
          actors={actorList}
          card={message.cardId ? cards.get(message.cardId) : undefined}
          cardActions={cardActions}
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
