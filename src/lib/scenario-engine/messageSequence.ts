import type { ChatMessage } from "@/lib/types/demo";

export function nextSequencedMessages({
  visibleMessages,
  nextMessages,
}: {
  visibleMessages: ChatMessage[];
  nextMessages: ChatMessage[];
}): ChatMessage[] {
  if (!isMessagePrefix(visibleMessages, nextMessages)) {
    return nextMessages;
  }

  return nextMessages.slice(0, Math.min(nextMessages.length, visibleMessages.length + 1));
}

export function isMessagePrefix(prefix: ChatMessage[], full: ChatMessage[]): boolean {
  if (prefix.length > full.length) {
    return false;
  }

  return prefix.every((message, index) => message.id === full[index]?.id);
}
