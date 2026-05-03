import { AvatarCluster } from "@/components/common/AvatarCluster";
import { KeyboardButton } from "@/components/common/KeyboardButton";
import type { Actor, DemoAction, DemoCard } from "@/lib/types/demo";

import { CardFrame } from "./CardFrame";
import { buildCardButtonModels, cardNumber, cardString, cardStringArray } from "./cardUtils";

export function ConfirmCard({
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
  const buttons = cardStringArray(card, "buttons");
  const participantActors = actors.filter((actor) => actor.role !== "bot").slice(0, cardNumber(card, "participantsCount", 8));

  return (
    <CardFrame card={card} contextLabel={contextLabel}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 px-3 py-3">
          <p className="text-xs font-semibold text-emerald-700">确认时间</p>
          <p className="mt-1 text-base font-bold text-slate-950">{cardString(card, "confirmedTime")}</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-3 py-3">
          <p className="text-xs font-semibold text-blue-700">确认地点</p>
          <p className="mt-1 text-base font-bold text-slate-950">{cardString(card, "confirmedPlace")}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">参加人数</span>
          <span className="text-lg font-bold text-emerald-600">{cardNumber(card, "participantsCount")} 人</span>
        </div>
        <div className="mt-3">
          <AvatarCluster actors={participantActors} />
        </div>
      </div>
      <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm leading-6 text-slate-700">
        待办提醒：{cardString(card, "todo")}
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
