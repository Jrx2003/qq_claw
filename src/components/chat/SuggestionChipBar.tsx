"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DemoAction } from "@/lib/types/demo";

export function SuggestionChipBar({
  actions,
  onAction,
  onSubmitText,
  inputDisabled = false,
  inputMode = "guided",
  placeholder,
}: {
  actions: DemoAction[];
  onAction: (actionId: string) => void;
  onSubmitText?: (text: string) => void;
  inputDisabled?: boolean;
  inputMode?: "guided" | "free";
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const chipActions = actions.filter((action) => action.kind === "chip" || action.kind === "toolbar" || action.kind === "scene-switch");
  const isFreeInput = inputMode === "free" && Boolean(onSubmitText);
  const canSubmit = isFreeInput && draft.trim().length > 0 && !inputDisabled;

  const submit = () => {
    const text = draft.trim();
    if (!text || !onSubmitText || inputDisabled) {
      return;
    }

    setDraft("");
    onSubmitText(text);
  };

  return (
    <footer className="border-t border-slate-200 bg-white px-3 py-3">
      {chipActions.length > 0 ? (
        <div className="mb-3 flex max-h-20 flex-wrap gap-2 overflow-y-auto pb-1">
          {chipActions.map((action) => (
            <button
              className="max-w-full rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-left text-sm font-medium leading-5 text-blue-700 transition hover:bg-blue-100"
              key={action.actionId}
              onClick={() => onAction(action.actionId)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-2xl bg-slate-100 px-3 py-2">
        {isFreeInput ? (
          <label className="min-w-0 flex-1">
            <span className="sr-only">自由输入</span>
            <textarea
              className="block max-h-24 min-h-10 w-full resize-none bg-transparent py-1 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400"
              disabled={inputDisabled}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder ?? "自由输入一句群聊消息，虾局长会识别意图并推进"}
              rows={1}
              value={draft}
            />
          </label>
        ) : (
          <span className="flex-1 truncate py-1.5 text-sm text-slate-400">
            {placeholder ?? "用上面的建议项推进演示"}
          </span>
        )}
        <Button
          aria-label="发送"
          className="h-8 w-8 rounded-full p-0"
          disabled={!canSubmit}
          onClick={submit}
          size="icon"
          type="button"
        >
          <SendHorizontal size={16} />
        </Button>
      </div>
    </footer>
  );
}
