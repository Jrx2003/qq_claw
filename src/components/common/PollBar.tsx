export function PollBar({
  label,
  votes,
  percent,
  leading = false,
}: {
  label: string;
  votes: number;
  percent: number;
  leading?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{votes} 票</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={leading ? "h-full rounded-full bg-qq-blue" : "h-full rounded-full bg-slate-300"}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
