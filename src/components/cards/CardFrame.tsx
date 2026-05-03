import { StatusBadge } from "@/components/common/StatusBadge";
import type { DemoCard } from "@/lib/types/demo";

export function CardFrame({
  card,
  children,
  contextLabel,
}: {
  card: DemoCard;
  children: React.ReactNode;
  contextLabel?: string;
}) {
  return (
    <article className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{card.title}</h3>
          {contextLabel ? <p className="mt-0.5 text-xs text-slate-500">{contextLabel}</p> : null}
        </div>
        <StatusBadge status={card.status} />
      </div>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </article>
  );
}
