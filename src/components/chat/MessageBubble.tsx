"use client";

import { motion } from "framer-motion";

import { CardRenderer } from "@/components/cards/CardRenderer";
import { Avatar } from "@/components/chat/Avatar";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { cn } from "@/lib/utils";
import type { Actor, ChatMessage, DemoAction, DemoCard } from "@/lib/types/demo";

const MAX_REVEAL_DELAY_SECONDS = 0.35;

export function MessageBubble({
  message,
  actor,
  card,
  actors,
  cardActions,
  contextLabel,
  onAction,
}: {
  message: ChatMessage;
  actor?: Actor;
  card?: DemoCard;
  actors: Actor[];
  cardActions: DemoAction[];
  contextLabel?: string;
  onAction: (actionId: string) => void;
}) {
  const isRight = message.side === "right";
  const revealDelaySeconds = Math.min((message.delayMs ?? 0) / 1000, MAX_REVEAL_DELAY_SECONDS);

  if (message.side === "system") {
    const isHint = message.type === "hint";

    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
        initial={{ opacity: 0, y: 8 }}
        transition={{ delay: revealDelaySeconds, duration: 0.18 }}
      >
        <span
          className={cn(
            "max-w-[88%] rounded-full px-3 py-1 text-center text-xs leading-5",
            isHint
              ? "border border-amber-100 bg-amber-50 text-amber-800"
              : "bg-slate-200 text-slate-500",
          )}
        >
          {message.text}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isRight ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: revealDelaySeconds, duration: 0.18 }}
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
        {message.type === "image" && message.imageUrl ? (
          <figure className="overflow-hidden rounded-2xl rounded-tl-sm bg-white shadow-sm ring-1 ring-slate-100">
            <div
              aria-label={message.alt ?? message.text ?? "群聊图片"}
              className="h-40 w-[min(280px,72vw)] bg-cover bg-center"
              style={{ backgroundImage: `url(${message.imageUrl})` }}
            />
            {message.text ? (
              <figcaption className="px-3 py-2 text-xs leading-5 text-slate-500">{message.text}</figcaption>
            ) : null}
          </figure>
        ) : null}
        {message.type === "card" && card ? (
          <div className="w-[min(330px,82vw)]">
            <CardRenderer
              actions={cardActions}
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
