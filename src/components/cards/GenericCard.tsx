import { KeyboardButton } from "@/components/common/KeyboardButton";
import type { DemoAction, DemoCard } from "@/lib/types/demo";

import { CardFrame } from "./CardFrame";
import { buildCardButtonModels, cardButtons, cardString } from "./cardUtils";

export function GenericCard({
  card,
  actions,
  contextLabel,
  onAction,
}: {
  card: DemoCard;
  actions: DemoAction[];
  contextLabel?: string;
  onAction: (actionId: string) => void;
}) {
  return (
    <CardFrame card={card} contextLabel={contextLabel}>
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
        {cardString(card, "summary")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {buildCardButtonModels(cardButtons(card), actions).map((button) => {
          const actionId = button.action?.actionId;

          return (
            <KeyboardButton
              disabled={button.disabled}
              key={button.label}
              label={button.label}
              onClick={actionId ? () => onAction(actionId) : undefined}
            />
          );
        })}
      </div>
    </CardFrame>
  );
}
