import { cn } from "@/lib/utils";

const toneByStatus: Record<string, string> = {
  正在收口中: "bg-orange-50 text-orange-700 ring-orange-200",
  投票进行中: "bg-rose-50 text-rose-700 ring-rose-200",
  已成局: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  已完成: "bg-teal-50 text-teal-700 ring-teal-200",
  已代发: "bg-blue-50 text-blue-700 ring-blue-200",
  劝导中: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        toneByStatus[status] ?? "bg-slate-50 text-slate-600 ring-slate-200",
      )}
    >
      {status}
    </span>
  );
}
