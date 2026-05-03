"use client";

import { motion } from "framer-motion";

import { CardRenderer } from "@/components/cards/CardRenderer";
import { Avatar } from "@/components/chat/Avatar";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { cn } from "@/lib/utils";
import type { Actor, ChatMessage, DemoAction, DemoCard } from "@/lib/types/demo";

export function MessageBubble({
  message,
  actor,
  card,
  actors,
  actions,
  contextLabel,
  onAction,
}: {
  message: ChatMessage;
  actor?: Actor;
  card?: DemoCard;
  actors: Actor[];
  actions: DemoAction[];
  contextLabel?: string;
  onAction: (actionId: string) => void;
}) {
  const isRight = message.side === "right";

  if (message.side === "system") {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
        initial={{ opacity: 0, y: 8 }}
      >
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-500">{message.text}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isRight ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22 }}
    >
      {!isRight ? <Avatar actor={actor} /> : null}
      <div className={cn("max-w-[82%] space-y-1", isRight ? "items-end" : "items-start")}>
        {!isRight ? (
          <div className="flex items-center gap-1.5 pl-1">
            <span className="text-xs font-medium text-slate-500">{actor?.name ?? message.actorId}</span>
            {actor?.badge ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                {actor.badge}
              </span>
            ) : null}
          </div>
        ) : null}
        {message.type === "typing" ? <TypingIndicator text={message.text} /> : null}
        {message.type === "text" ? (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-[15px] leading-6 shadow-sm",
              isRight
                ? "rounded-tr-sm bg-qq-blue text-white"
                : actor?.role === "bot"
                  ? "rounded-tl-sm bg-white text-slate-800 ring-1 ring-amber-100"
                  : "rounded-tl-sm bg-white text-slate-800",
            )}
          >
            {message.text}
          </div>
        ) : null}
        {message.type === "card" && card ? (
          <div className="w-[min(330px,82vw)]">
            <CardRenderer
              actions={actions}
              actors={actors}
              card={card}
              contextLabel={contextLabel}
              onAction={onAction}
            />
          </div>
        ) : null}
      </div>
      {isRight ? <Avatar actor={actor} /> : null}
    </motion.div>
  );
}
