import { Suspense } from "react";

import { ChatDemoPage } from "@/components/demo/ChatDemoPage";

export default function DemoPage() {
  return (
    <Suspense>
      <ChatDemoPage />
    </Suspense>
  );
}
