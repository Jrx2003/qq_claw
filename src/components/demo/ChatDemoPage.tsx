"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Home, PanelLeft } from "lucide-react";

import { ChatShell } from "@/components/chat/ChatShell";
import { DemoToolbar } from "@/components/demo/DemoToolbar";
import { StateInspector } from "@/components/demo/StateInspector";
import { StudioPanel } from "@/components/demo/StudioPanel";
import type { StudioConversation } from "@/lib/llm/schemas";
import { collectSceneActions, findBeat } from "@/lib/scenario-engine/engine";
import { runClientLlmTask } from "@/lib/scenario-engine/llmRuntime";
import {
  buildStudioSuggestionActions,
  buildStudioTurnMessages,
  resolveStudioCardId,
} from "@/lib/scenario-engine/studioConversation";
import { sceneTextArray } from "@/lib/sceneMeta";
import { useDemoStore } from "@/lib/state/demoStore";
import {
  appModeSchema,
  runtimeModeSchema,
  sceneIdSchema,
  type AppMode,
  type ChatMessage,
  type DemoAction,
  type RuntimeMode,
} from "@/lib/types/demo";

const AUTOPLAY_TICK_MS = 3600;

export function ChatDemoPage({
  defaultMode = "judge",
  defaultRuntimeMode = "snapshot",
  showStudioTools = false,
}: {
  defaultMode?: AppMode;
  defaultRuntimeMode?: RuntimeMode;
  showStudioTools?: boolean;
}) {
  const searchParams = useSearchParams();
  const {
    mode,
    runtimeMode,
    sceneId,
    currentBeatId,
    currentScene,
    sceneManifest,
    actors,
    cards,
    messages,
    activeCards,
    availableActions,
    debugOpen,
    autoplayRunning,
    switchMode,
    switchRuntimeMode,
    switchScene,
    triggerAction,
    replay,
    jumpToStep,
    setDebugOpen,
    setAutoplayRunning,
    autoplayTick,
  } = useDemoStore();
  const [studioMessages, setStudioMessages] = useState<ChatMessage[]>([]);
  const [studioActions, setStudioActions] = useState<DemoAction[]>([]);
  const [studioPending, setStudioPending] = useState(false);
  const [studioError, setStudioError] = useState<string>();
  const [lastStudioResponse, setLastStudioResponse] = useState<StudioConversation>();
  const [studioTurnIndex, setStudioTurnIndex] = useState(0);

  const actorList = useMemo(() => Array.from(actors.values()), [actors]);
  const effectiveMode = showStudioTools ? "studio" : defaultMode === "judge" ? "judge" : mode;
  const displayedMessages = showStudioTools ? [...messages, ...studioMessages] : messages;
  const displayedActions = showStudioTools ? studioActions : availableActions;
  const stageLabels = sceneTextArray(currentScene, "stageLabels", ["收口", "投票", "成局", "回忆"]);
  const stageProgressCount = resolveStageProgressCount(currentBeatId, activeCards.length);
  const navLinkClass = (targetMode: AppMode) =>
    [
      "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition",
      effectiveMode === targetMode
        ? targetMode === "studio"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-blue-50 text-blue-700"
        : "border border-slate-200 bg-white text-slate-650 hover:bg-slate-50",
    ].join(" ");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const runtimeParam = searchParams.get("runtime");
    const sceneParam = searchParams.get("scene");
    const debugParam = searchParams.get("debug");
    const parsedMode = modeParam ? appModeSchema.safeParse(modeParam) : appModeSchema.safeParse(defaultMode);
    const parsedRuntime = runtimeParam
      ? runtimeModeSchema.safeParse(runtimeParam)
      : runtimeModeSchema.safeParse(defaultRuntimeMode);
    const parsedScene = sceneParam ? sceneIdSchema.safeParse(sceneParam) : null;

    if (parsedRuntime.success) {
      switchRuntimeMode(parsedRuntime.data);
    }

    if (parsedScene?.success) {
      switchScene(parsedScene.data, parsedMode?.success ? parsedMode.data : undefined);
    } else if (parsedMode?.success) {
      switchMode(parsedMode.data);
    }

    if (showStudioTools || debugParam === "1") {
      setDebugOpen(true);
    }
  }, [
    defaultMode,
    defaultRuntimeMode,
    searchParams,
    setAutoplayRunning,
    setDebugOpen,
    showStudioTools,
    switchMode,
    switchRuntimeMode,
    switchScene,
  ]);

  useEffect(() => {
    setStudioMessages([]);
    setStudioActions([]);
    setStudioError(undefined);
    setLastStudioResponse(undefined);
    setStudioTurnIndex(0);
  }, [sceneId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "d") {
        setDebugOpen(!debugOpen);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [debugOpen, setDebugOpen]);

  useEffect(() => {
    if (!autoplayRunning) {
      return;
    }

    const timeout = window.setTimeout(() => {
      autoplayTick();
    }, AUTOPLAY_TICK_MS);

    return () => window.clearTimeout(timeout);
  }, [autoplayRunning, autoplayTick, messages.length, sceneId]);

  const handleNext = () => {
    const nextAction = availableActions.find((action) => action.kind !== "scene-switch");
    if (nextAction) {
      triggerAction(nextAction.id);
    }
  };

  const submitStudioPrompt = async (text: string) => {
    if (!showStudioTools || studioPending) {
      return;
    }

    const nextTurnIndex = studioTurnIndex + 1;
    setStudioTurnIndex(nextTurnIndex);
    setStudioPending(true);
    setStudioError(undefined);

    try {
      const response = await runClientLlmTask<StudioConversation>(
        "studio-conversation",
        {
          scene: {
            id: currentScene.id,
            title: currentScene.title,
            progressLabel: (currentScene as { progressLabel?: string }).progressLabel,
          },
          actors: actorList.map((actor) => ({
            id: actor.id,
            name: actor.name,
            role: actor.role,
            traits: actor.traits ?? [],
          })),
          recentMessages: displayedMessages.slice(-14).map((message) => ({
            actorId: message.actorId,
            side: message.side,
            type: message.type,
            text: message.text,
            cardId: message.cardId,
          })),
          userText: text,
          availableFunctions: ["intent", "anonymous", "conflict", "recap", "game-recap"],
        },
        runtimeMode,
      );
      const cardId = resolveStudioCardId(response.data);
      const nextMessages = buildStudioTurnMessages({
        turnIndex: nextTurnIndex,
        userText: text,
        response: response.data,
        cardId,
      });
      const chips = response.data.function_suggestion
        ? [response.data.function_suggestion.label, ...response.data.chips]
        : response.data.chips;

      setStudioMessages((current) => [...current, ...nextMessages]);
      setStudioActions(buildStudioSuggestionActions(chips));
      setLastStudioResponse(response.data);
    } catch (caught) {
      setStudioError(caught instanceof Error ? caught.message : "unknown error");
      setStudioMessages((current) => [
        ...current,
        ...buildStudioTurnMessages({
          turnIndex: nextTurnIndex,
          userText: text,
          response: {
            intent_type: "none",
            stage: "follow_up",
            bot_message: "这句我暂时没接稳。你可以换一种说法，或者直接说想组局、匿名发起、处理争执、开黑补位。",
            npc_messages: [{ actorId: "xiaoyu", text: "可以再说具体一点，我跟得上。" }],
            chips: ["先确认去不去", "匿名问问大家", "先帮他们降温"],
          },
        }),
      ]);
      setStudioActions(buildStudioSuggestionActions(["先确认去不去", "匿名问问大家", "先帮他们降温"]));
    } finally {
      setStudioPending(false);
    }
  };

  const handleChatAction = (actionId: string) => {
    if (showStudioTools && actionId.startsWith("studio.prompt.")) {
      const action = studioActions.find((candidate) => candidate.actionId === actionId);
      if (action) {
        void submitStudioPrompt(action.label);
      }
      return;
    }

    triggerAction(actionId);
  };

  const currentBeat = findBeat(currentScene, currentBeatId);
  const cardActions = collectSceneActions(currentScene);

  return (
    <div className="min-h-screen px-4 py-4 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-6xl flex-col items-center justify-center gap-5 lg:flex-row lg:items-center">
        <nav className="fixed left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 p-2 shadow-card backdrop-blur">
          <Link
            aria-label="返回主界面"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            href="/"
          >
            <Home size={18} />
          </Link>
          <Link
            className={navLinkClass("judge")}
            href="/judge"
          >
            <PanelLeft size={15} />
            无 LLM 评审
          </Link>
          <Link
            className={navLinkClass("studio")}
            href="/studio?key=local-studio"
          >
            <FlaskConical size={15} />
            真实 LLM 工作台
          </Link>
        </nav>
        <ChatShell
          actions={displayedActions}
          actors={actors}
          cardActions={showStudioTools ? [...cardActions, ...studioActions] : cardActions}
          cards={cards}
          inputDisabled={studioPending}
          inputMode={showStudioTools ? "free" : "guided"}
          inputPlaceholder={showStudioTools ? "自由输入一句群聊消息，例如：周五有人想吃烤肉吗？" : undefined}
          messages={displayedMessages}
          mode={effectiveMode}
          onAction={handleChatAction}
          onSubmitText={showStudioTools ? submitStudioPrompt : undefined}
          scene={currentScene}
        />
        <div className="flex w-full max-w-[430px] flex-col gap-4 lg:max-w-[390px]">
          <DemoToolbar
            autoplayRunning={autoplayRunning}
            debugOpen={debugOpen}
            onAutoplay={() => {
              switchScene(currentScene.id, mode);
              setAutoplayRunning(true);
            }}
            onDebug={() => setDebugOpen(!debugOpen)}
            onNext={handleNext}
            onReplay={replay}
            onScene={(nextSceneId) => switchScene(nextSceneId)}
            painPoint={currentBeat.painPoint}
            scene={currentScene}
            sceneManifest={sceneManifest}
            showStudioTools={showStudioTools}
          />
          <div className="grid grid-cols-5 gap-2">
            {stageLabels.map((label, index) => (
              <div
                className={`rounded-2xl px-3 py-2 text-center text-xs font-bold ${
                  stageProgressCount > index
                    ? "bg-emerald-500 text-white"
                    : "border border-white/70 bg-white/70 text-slate-500"
                }`}
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
          {showStudioTools ? (
            <StudioPanel
              actors={actorList}
              error={studioError}
              lastResponse={lastStudioResponse}
              onPrompt={submitStudioPrompt}
              pending={studioPending}
              runtimeMode={runtimeMode}
              scene={currentScene}
            />
          ) : null}
          {debugOpen && showStudioTools ? (
            <StateInspector cards={cards} onJump={jumpToStep} scene={currentScene} state={useDemoStore.getState()} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function resolveStageProgressCount(currentBeatId: string, activeCardCount: number) {
  if (/recap|preference|memory|summary/.test(currentBeatId)) {
    return Math.max(activeCardCount, 5);
  }

  if (/confirm|roster|outing_reminder|extra_note/.test(currentBeatId)) {
    return Math.max(activeCardCount, 4);
  }

  if (/remind|more_votes|dm_pending|decline/.test(currentBeatId)) {
    return Math.max(activeCardCount, 3);
  }

  return activeCardCount;
}
