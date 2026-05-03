"use client";

import { ChevronLeft, MoreHorizontal, Phone, Users } from "lucide-react";

import { sceneText } from "@/lib/sceneMeta";
import type { AppMode, SceneDefinition } from "@/lib/types/demo";

export function ChatHeader({
  scene,
  mode,
}: {
  scene: SceneDefinition;
  mode: AppMode;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3">
      <button aria-label="返回" className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
        <ChevronLeft size={23} />
      </button>
      <div className="min-w-0 text-center">
        <h1 className="truncate text-lg font-bold leading-tight text-slate-950">
          {sceneText(scene, "groupName", "群聊")}
        </h1>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500">
          <Users size={12} />
          <span>{sceneText(scene, "onlineText", "8 人在线")}</span>
          <span className="mx-1 h-1 w-1 rounded-full bg-slate-300" />
          <span>{mode}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button aria-label="电话" className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
          <Phone size={18} />
        </button>
        <button aria-label="更多" className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </header>
  );
}
