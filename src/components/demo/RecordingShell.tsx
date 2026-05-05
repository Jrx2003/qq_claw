"use client";

import { ChatDemoPage } from "@/components/demo/ChatDemoPage";

export function RecordingShell() {
  return (
    <ChatDemoPage
      defaultMode="recording"
      defaultRuntimeMode="snapshot"
      recordingControls
    />
  );
}
