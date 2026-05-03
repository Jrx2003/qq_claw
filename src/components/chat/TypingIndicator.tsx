export function TypingIndicator({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
      <span className="text-sm text-slate-500">{text ?? "虾局长正在处理..."}</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((item) => (
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400"
            key={item}
            style={{ animationDelay: `${item * 120}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
