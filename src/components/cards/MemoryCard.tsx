import { KeyboardButton } from "@/components/common/KeyboardButton";
import { MemoryPhotoStrip } from "@/components/common/MemoryPhotoStrip";
import { OptionChip } from "@/components/common/OptionChip";
import type { DemoAction, DemoCard } from "@/lib/types/demo";

import { CardFrame } from "./CardFrame";
import { buildCardButtonModels, cardString, cardStringArray } from "./cardUtils";

export function MemoryCard({
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
      <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm leading-6 text-slate-700">
        {cardString(card, "summary")}
      </p>
      <MemoryPhotoStrip />
      <section>
        <p className="mb-2 text-xs font-semibold text-slate-500">本次关键词</p>
        <div className="flex flex-wrap gap-2">
          {cardStringArray(card, "keywords").map((keyword) => (
            <OptionChip active key={keyword}>
              {keyword}
            </OptionChip>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-3 gap-2">
        {buildCardButtonModels(cardStringArray(card, "buttons"), actions).map((button) => {
          const actionId = button.action?.id;

          return (
            <KeyboardButton
              disabled={button.disabled}
              key={button.label}
              label={button.label}
              onClick={actionId ? () => onAction(actionId) : undefined}
              tone={button.label.includes("下次") ? "success" : "outline"}
            />
          );
        })}
      </div>
    </CardFrame>
  );
}
