import { Suspense } from "react";

import { JudgeShell } from "@/components/demo/JudgeShell";

export default function JudgePage() {
  return (
    <Suspense>
      <JudgeShell />
    </Suspense>
  );
}
