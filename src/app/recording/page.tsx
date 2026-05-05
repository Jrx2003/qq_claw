import { Suspense } from "react";

import { RecordingShell } from "@/components/demo/RecordingShell";

export default function RecordingPage() {
  return (
    <Suspense>
      <RecordingShell />
    </Suspense>
  );
}
