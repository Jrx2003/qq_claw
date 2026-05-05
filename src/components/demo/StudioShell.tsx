"use client";

import { ChatDemoPage } from "@/components/demo/ChatDemoPage";

export function StudioShell() {
  return (
    <ChatDemoPage
      defaultMode="studio"
      defaultRuntimeMode="snapshot"
      showStudioTools
    />
  );
}
