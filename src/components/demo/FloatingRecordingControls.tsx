"use client";

import { Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FloatingRecordingControls({
  onNext,
  onReplay,
  onResume,
}: {
  onNext: () => void;
  onReplay: () => void;
  onResume: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full border border-white/70 bg-white/90 p-2 shadow-soft backdrop-blur">
      <Button className="rounded-full" onClick={onResume} type="button">
        <Play size={16} />
      </Button>
      <Button className="rounded-full" onClick={onNext} type="button" variant="outline">
        <SkipForward size={16} />
      </Button>
      <Button className="rounded-full" onClick={onReplay} type="button" variant="outline">
        <RotateCcw size={16} />
      </Button>
    </div>
  );
}
