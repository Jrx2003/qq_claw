"use client";

import { useEffect, useRef, useState } from "react";

import { isMessagePrefix, nextSequencedMessages } from "@/lib/scenario-engine/messageSequence";
import type { ChatMessage } from "@/lib/types/demo";

const MESSAGE_REVEAL_INTERVAL_MS = 520;
const FIRST_REVEAL_DELAY_MS = 40;

export function useSequencedMessages(messages: ChatMessage[]): ChatMessage[] {
  const [visibleMessages, setVisibleMessages] = useState(messages);
  const visibleRef = useRef(messages);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timerRef.current);

    if (!isMessagePrefix(visibleRef.current, messages)) {
      visibleRef.current = messages;
      setVisibleMessages(messages);
      return;
    }

    if (visibleRef.current.length >= messages.length) {
      return;
    }

    const revealNext = () => {
      const nextVisible = nextSequencedMessages({
        visibleMessages: visibleRef.current,
        nextMessages: messages,
      });

      visibleRef.current = nextVisible;
      setVisibleMessages(nextVisible);

      if (nextVisible.length < messages.length) {
        timerRef.current = window.setTimeout(revealNext, MESSAGE_REVEAL_INTERVAL_MS);
      }
    };

    timerRef.current = window.setTimeout(revealNext, FIRST_REVEAL_DELAY_MS);

    return () => window.clearTimeout(timerRef.current);
  }, [messages]);

  return visibleMessages;
}
