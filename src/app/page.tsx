import { Suspense } from "react";

import { ChatDemoPage } from "@/components/demo/ChatDemoPage";

export default function Home() {
  return (
    <Suspense>
      <ChatDemoPage />
    </Suspense>
  );
}
