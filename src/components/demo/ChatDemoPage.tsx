"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Home, PanelLeft } from "lucide-react";

import { ChatShell } from "@/components/chat/ChatShell";
import { DemoToolbar } from "@/components/demo/DemoToolbar";
import { StateInspector } from "@/components/demo/StateInspector";
import { StudioPanel } from "@/components/demo/StudioPanel";
import { collectSceneActions, findBeat } from "@/lib/scenario-engine/engine";
import { sceneTextArray } from "@/lib/sceneMeta";
import { useDemoStore } from "@/lib/state/demoStore";
import {
  appModeSchema,
  runtimeModeSchema,
  sceneIdSchema,
  type AppMode,
  type RuntimeMode,
} from "@/lib/types/demo";

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
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [autoplayRunning, autoplayTick, messages.length, sceneId]);

  const handleMode = (nextMode: AppMode) => {
    switchMode(nextMode);
    setAutoplayRunning(false);
    if (nextMode === "studio") {
      setDebugOpen(true);
    }
  };

  const handleNext = () => {
    const nextAction = availableActions.find((action) => action.kind !== "scene-switch");
    if (nextAction) {
      triggerAction(nextAction.id);
    }
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
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            href="/judge"
          >
            <PanelLeft size={15} />
            无 LLM 评审
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-650 transition hover:bg-slate-50"
            href="/studio?key=local-studio"
          >
            <FlaskConical size={15} />
            真实 LLM 工作台
          </Link>
        </nav>
        <ChatShell
          actions={availableActions}
          actors={actors}
          cardActions={cardActions}
          cards={cards}
          messages={messages}
          mode={mode}
          onAction={triggerAction}
          scene={currentScene}
        />
        <div className="flex w-full max-w-[430px] flex-col gap-4 lg:max-w-[390px]">
          <DemoToolbar
            autoplayRunning={autoplayRunning}
            debugOpen={debugOpen}
            mode={mode}
            onAutoplay={() => {
              switchScene(currentScene.id, mode);
              setAutoplayRunning(true);
            }}
            onDebug={() => setDebugOpen(!debugOpen)}
            onMode={handleMode}
            onNext={handleNext}
            onReplay={replay}
            onRuntimeMode={switchRuntimeMode}
            onScene={(nextSceneId) => switchScene(nextSceneId)}
            scene={currentScene}
            sceneManifest={sceneManifest}
            runtimeMode={runtimeMode}
            showStudioTools={showStudioTools}
          />
          <div className="grid grid-cols-4 gap-2">
            {sceneTextArray(currentScene, "stageLabels", ["收口", "投票", "成局", "回忆"]).map((label, index) => (
              <div
                className={`rounded-2xl px-3 py-2 text-center text-xs font-bold ${
                  activeCards.length > index
                    ? "bg-emerald-500 text-white"
                    : "border border-white/70 bg-white/70 text-slate-500"
                }`}
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
          <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-card">
            <p className="text-xs font-bold uppercase text-blue-500">这一幕为什么这样设计</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{currentBeat.act ?? currentBeat.description}</h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-650">
              <p>
                <span className="font-bold text-slate-900">痛点：</span>
                {currentBeat.painPoint}
              </p>
              <p>
                <span className="font-bold text-slate-900">设计意图：</span>
                {currentBeat.designIntent}
              </p>
              <p>
                <span className="font-bold text-slate-900">期望效果：</span>
                {currentBeat.expectedEffect}
              </p>
            </div>
          </section>
          {showStudioTools ? (
            <StudioPanel runtimeMode={runtimeMode} sceneId={sceneId} />
          ) : null}
          {debugOpen && showStudioTools ? (
            <StateInspector cards={cards} onJump={jumpToStep} scene={currentScene} state={useDemoStore.getState()} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
