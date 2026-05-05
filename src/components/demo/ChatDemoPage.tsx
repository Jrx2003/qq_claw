"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { ChatShell } from "@/components/chat/ChatShell";
import { DemoToolbar } from "@/components/demo/DemoToolbar";
import { StateInspector } from "@/components/demo/StateInspector";
import { StudioPanel } from "@/components/demo/StudioPanel";
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
  recordingControls = false,
}: {
  defaultMode?: AppMode;
  defaultRuntimeMode?: RuntimeMode;
  showStudioTools?: boolean;
  recordingControls?: boolean;
}) {
  const searchParams = useSearchParams();
  const {
    mode,
    experienceMode,
    runtimeMode,
    sceneId,
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
    resumeRecording,
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
      if (parsedMode.data === "recording") {
        setAutoplayRunning(true);
      }
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
    setAutoplayRunning(nextMode === "recording");
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

  return (
    <div className="min-h-screen px-4 py-4 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-6xl flex-col items-center justify-center gap-5 lg:flex-row lg:items-center">
        <ChatShell
          actions={availableActions}
          actors={actors}
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
            experienceMode={experienceMode}
            mode={mode}
            onAutoplay={() => {
              if (currentScene.id !== "dinner_core") {
                switchScene("dinner_core", "recording");
              }
              setAutoplayRunning(true);
            }}
            onDebug={() => setDebugOpen(!debugOpen)}
            onMode={handleMode}
            onNext={handleNext}
            onReplay={replay}
            onResume={resumeRecording}
            onRuntimeMode={switchRuntimeMode}
            onScene={(nextSceneId) => switchScene(nextSceneId)}
            scene={currentScene}
            sceneManifest={sceneManifest}
            recordingControls={recordingControls}
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
