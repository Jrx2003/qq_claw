import { KeyboardButton } from "@/components/common/KeyboardButton";
import { OptionChip } from "@/components/common/OptionChip";
import type { DemoAction, DemoCard } from "@/lib/types/demo";

import { CardFrame } from "./CardFrame";
import { buildCardButtonModels, cardString, cardStringArray } from "./cardUtils";

export function PlanCard({
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
  const buttons = cardStringArray(card, "buttons");
  const featuredTime = cardString(card, "featuredTimeOption");
  const featuredPlace = cardString(card, "featuredPlaceOption");

  return (
    <CardFrame card={card} contextLabel={contextLabel}>
      <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm leading-6 text-slate-700">
        {cardString(card, "summary")}
      </p>
      <section>
        <p className="mb-2 text-xs font-semibold text-slate-500">时间选项</p>
        <div className="flex flex-wrap gap-2">
          {cardStringArray(card, "timeOptions").map((option) => (
            <OptionChip active={option === featuredTime} key={option}>
              {option}
            </OptionChip>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 text-xs font-semibold text-slate-500">地点选项</p>
        <div className="flex flex-wrap gap-2">
          {cardStringArray(card, "placeOptions").map((option) => (
            <OptionChip active={option === featuredPlace} key={option}>
              {option}
            </OptionChip>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-xs font-semibold text-slate-500">还没回复</p>
        <p className="mt-1 text-sm text-slate-700">{cardStringArray(card, "pendingMembers").join("、")}</p>
      </section>
      <div className="grid grid-cols-2 gap-2">
        {buildCardButtonModels(buttons, actions).map((button) => {
          const actionId = button.action?.id;

          return (
            <KeyboardButton
              disabled={button.disabled}
              key={button.label}
              label={button.label}
              onClick={actionId ? () => onAction(actionId) : undefined}
              tone={button.label.includes("参加") ? "success" : "outline"}
            />
          );
        })}
      </div>
    </CardFrame>
  );
}
