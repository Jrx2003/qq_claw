import type { Actor } from "@/lib/types/demo";

const avatarToneByRole: Record<string, string> = {
  bot: "from-orange-100 via-amber-100 to-yellow-200 text-orange-800",
  judge: "from-blue-100 via-sky-100 to-blue-200 text-blue-800",
  npc: "from-slate-100 via-white to-emerald-100 text-slate-700",
};

export function Avatar({ actor }: { actor?: Actor }) {
  const role = actor?.role ?? "npc";
  const label = actor?.name?.slice(0, 1) ?? "?";

  return (
    <div
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold shadow-sm ${avatarToneByRole[role] ?? avatarToneByRole.npc}`}
    >
      {role === "bot" ? "虾" : label}
    </div>
  );
}
