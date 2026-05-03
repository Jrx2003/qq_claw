import type { Actor } from "@/lib/types/demo";

export function AvatarCluster({ actors }: { actors: Actor[] }) {
  return (
    <div className="flex items-center">
      {actors.slice(0, 6).map((actor, index) => (
        <span
          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-emerald-100 text-[11px] font-semibold text-slate-700 shadow-sm"
          key={actor.id}
          style={{ marginLeft: index === 0 ? 0 : -8 }}
        >
          {actor.name.slice(0, 1)}
        </span>
      ))}
      <span className="ml-2 text-xs text-slate-500">{actors.length} 人</span>
    </div>
  );
}
