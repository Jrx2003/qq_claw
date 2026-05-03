import { ConfirmCard } from "@/components/cards/ConfirmCard";
import { GenericCard } from "@/components/cards/GenericCard";
import { MemoryCard } from "@/components/cards/MemoryCard";
import { PlanCard } from "@/components/cards/PlanCard";
import { VoteProgressCard } from "@/components/cards/VoteProgressCard";
import type { Actor, DemoAction, DemoCard } from "@/lib/types/demo";

export function CardRenderer({
  card,
  actions,
  actors,
  contextLabel,
  onAction,
}: {
  card: DemoCard;
  actions: DemoAction[];
  actors: Actor[];
  contextLabel?: string;
  onAction: (actionId: string) => void;
}) {
  if (card.cardType === "plan") {
    return <PlanCard actions={actions} card={card} contextLabel={contextLabel} onAction={onAction} />;
  }

  if (card.cardType === "vote") {
    return <VoteProgressCard actions={actions} card={card} contextLabel={contextLabel} onAction={onAction} />;
  }

  if (card.cardType === "confirm") {
    return <ConfirmCard actions={actions} actors={actors} card={card} contextLabel={contextLabel} onAction={onAction} />;
  }

  if (card.cardType === "memory") {
    return <MemoryCard actions={actions} card={card} contextLabel={contextLabel} onAction={onAction} />;
  }

  return <GenericCard actions={actions} card={card} contextLabel={contextLabel} onAction={onAction} />;
}
