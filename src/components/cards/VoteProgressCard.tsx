import { KeyboardButton } from "@/components/common/KeyboardButton";
import { PollBar } from "@/components/common/PollBar";
import type { DemoAction, DemoCard } from "@/lib/types/demo";

import { CardFrame } from "./CardFrame";
import { buildCardButtonModels, cardString, cardStringArray, cardVoteRows } from "./cardUtils";

export function VoteProgressCard({
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
  const timeVotes = cardVoteRows(card, "timeVotes");
  const placeVotes = cardVoteRows(card, "placeVotes");
  const buttons = cardStringArray(card, "buttons");

  return (
    <CardFrame card={card} contextLabel={contextLabel}>
      <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
        <span className="text-sm font-semibold text-slate-700">已回复</span>
        <span className="text-lg font-bold text-rose-600">{cardString(card, "replied")} 人</span>
      </div>
      <section className="space-y-2.5">
        <p className="text-xs font-semibold text-slate-500">时间投票</p>
        {timeVotes.map((row, index) => (
          <PollBar key={row.label} {...row} leading={index === 1} />
        ))}
      </section>
      <section className="space-y-2.5">
        <p className="text-xs font-semibold text-slate-500">地点投票</p>
        {placeVotes.map((row, index) => (
          <PollBar key={row.label} {...row} leading={index === 0} />
        ))}
      </section>
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        未回复：{cardStringArray(card, "pendingMembers").join("、")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {buildCardButtonModels(buttons, actions).map((button) => {
          const actionId = button.action?.id;

          return (
            <KeyboardButton
              disabled={button.disabled}
              key={button.label}
              label={button.label}
              onClick={actionId ? () => onAction(actionId) : undefined}
              tone={button.label.includes("提醒") ? "warn" : "outline"}
            />
          );
        })}
      </div>
    </CardFrame>
  );
}
