"use client";

import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DemoAction } from "@/lib/types/demo";

export function SuggestionChipBar({
  actions,
  onAction,
}: {
  actions: DemoAction[];
  onAction: (actionId: string) => void;
}) {
  const chipActions = actions.filter((action) => action.kind === "chip" || action.kind === "toolbar" || action.kind === "scene-switch");

  return (
    <footer className="border-t border-slate-200 bg-white px-3 py-3">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {chipActions.map((action) => (
          <button
            className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            key={action.actionId}
            onClick={() => onAction(action.actionId)}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
        <span className="flex-1 truncate text-sm text-slate-400">用上面的建议项推进演示</span>
        <Button aria-label="发送" className="h-8 w-8 rounded-full p-0" size="icon" type="button">
          <SendHorizontal size={16} />
        </Button>
      </div>
    </footer>
  );
}
