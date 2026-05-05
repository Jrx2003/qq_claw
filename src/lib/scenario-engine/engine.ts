import { loadCardMap } from "../fixtures/loader";
import type {
  ChatMessage,
  DemoAction,
  DemoBeat,
  DemoCard,
  DemoState,
  ExperienceMode,
  RuntimeMode,
  SceneDefinition,
  TimelinePausePoint,
  TriggerPreset,
} from "../types/demo";

type InitialStateOptions =
  | ExperienceMode
  | {
      experienceMode?: ExperienceMode;
      runtimeMode?: RuntimeMode;
      triggerPreset?: TriggerPreset;
      autoplay?: boolean;
    };

export type Timeline = {
  entryBeatId: string;
  beats: DemoBeat[];
  recordingEndBeatId?: string;
};

export function createInitialDemoState(
  scene: SceneDefinition,
  options: InitialStateOptions = {},
): DemoState {
  const timeline = getTimeline(scene);
  const entryBeat = findBeat(scene, timeline.entryBeatId);
  const normalizedOptions = normalizeInitialOptions(scene, options);

  return applyBeat(
    {
      experienceMode: normalizedOptions.experienceMode,
      runtimeMode: normalizedOptions.runtimeMode,
      triggerPreset: normalizedOptions.triggerPreset,
      mode: normalizedOptions.experienceMode,
      sceneId: scene.id,
      currentBeatId: entryBeat.id,
      currentStepId: entryBeat.id,
      playedBeatIds: [],
      playedStepIds: [],
      messages: [],
      activeCards: [],
      availableActions: [],
      flags: {},
      recording: {
        running: normalizedOptions.autoplay,
        paused: false,
      },
    },
    entryBeat,
  );
}

export function advanceStep(
  scene: SceneDefinition,
  state: DemoState,
  actionId: string,
): DemoState {
  const action = state.availableActions.find(
    (candidate) => candidate.actionId === actionId || candidate.id === actionId,
  );

  if (!action) {
    throw new Error(`Action "${actionId}" is not available at beat "${state.currentBeatId}".`);
  }

  const nextBeat = findBeat(scene, action.nextBeatId);

  if (nextBeat.id === getTimeline(scene).entryBeatId) {
    return createInitialDemoState(scene, {
      experienceMode: state.experienceMode,
      runtimeMode: state.runtimeMode,
      triggerPreset: state.triggerPreset,
      autoplay: state.recording.running,
    });
  }

  return applyBeat(state, nextBeat);
}

export function goToStep(scene: SceneDefinition, state: DemoState, stepId: string): DemoState {
  const nextBeat = findBeat(scene, stepId);

  if (nextBeat.id === getTimeline(scene).entryBeatId) {
    return createInitialDemoState(scene, {
      experienceMode: state.experienceMode,
      runtimeMode: state.runtimeMode,
      triggerPreset: state.triggerPreset,
      autoplay: state.recording.running,
    });
  }

  return applyBeat(state, nextBeat);
}

export function runAutoplayPath(scene: SceneDefinition): DemoState {
  let state = createRecordingState(scene);
  const visited = new Set<string>();
  const endBeatId = getTimeline(scene).recordingEndBeatId;

  while (!endBeatId || state.currentBeatId !== endBeatId) {
    if (visited.has(state.currentBeatId)) {
      throw new Error(`Autoplay reached a loop at beat "${state.currentBeatId}".`);
    }

    visited.add(state.currentBeatId);

    const action = selectAutoplayAction(state.availableActions);

    if (!action) {
      throw new Error(`Autoplay has no usable action at beat "${state.currentBeatId}".`);
    }

    state = applyRecordingFlags(advanceStep(scene, state, action.actionId), {
      running: true,
      paused: false,
      pausePoint: undefined,
    });
  }

  return state;
}

export function createRecordingState(scene: SceneDefinition): DemoState {
  return createInitialDemoState(scene, {
    experienceMode: "recording",
    runtimeMode: scene.runtimeDefault ?? "snapshot",
    triggerPreset: scene.triggerPreset ?? "balanced",
    autoplay: true,
  });
}

export function playNextTimelineBeat(scene: SceneDefinition, state: DemoState): DemoState {
  const action = selectAutoplayAction(state.availableActions);

  if (!action) {
    return applyRecordingFlags(state, {
      running: false,
      paused: true,
      pausePoint: {
        id: "pause.no_action",
        title: "没有可自动推进的动作",
      },
    });
  }

  const nextState = advanceStep(scene, state, action.actionId);
  const pausePoint = nextState.recording.pausePoint;

  return applyRecordingFlags(nextState, {
    running: !pausePoint,
    paused: Boolean(pausePoint),
    pausePoint,
  });
}

export function getTimeline(scene: SceneDefinition): Timeline {
  return {
    entryBeatId: scene.entryBeatId,
    beats: scene.beats,
    recordingEndBeatId: scene.recordingEndBeatId,
  };
}

export function findStep(scene: SceneDefinition, stepId: string): DemoBeat {
  return findBeat(scene, stepId);
}

export function findBeat(scene: SceneDefinition, beatId: string): DemoBeat {
  const beat = getTimeline(scene).beats.find((candidate) => candidate.id === beatId);

  if (!beat) {
    throw new Error(`Scene "${scene.id}" does not define beat "${beatId}".`);
  }

  return beat;
}

function applyBeat(state: DemoState, beat: DemoBeat): DemoState {
  const messages = appendUniqueMessages(state.messages, beat.messages ?? []);
  const activeCards = resolveActiveCards(messages);
  const pausePoint = beat.pausePoint;

  return {
    ...state,
    currentBeatId: beat.id,
    currentStepId: beat.id,
    playedBeatIds: Array.from(new Set([...state.playedBeatIds, beat.id])),
    playedStepIds: Array.from(new Set([...state.playedStepIds, beat.id])),
    messages,
    activeCards,
    availableActions: beat.availableActions ?? [],
    flags: {
      ...state.flags,
      ...(beat.setFlags ?? {}),
    },
    recording: {
      ...state.recording,
      pausePoint,
      paused: state.experienceMode === "recording" && Boolean(pausePoint),
      running: state.experienceMode === "recording" ? !pausePoint : state.recording.running,
    },
    lastLlmTask: beat.llmTask ?? state.lastLlmTask,
  };
}

function appendUniqueMessages(
  existingMessages: ChatMessage[],
  incomingMessages: ChatMessage[],
): ChatMessage[] {
  const existingIds = new Set(existingMessages.map((message) => message.id));
  const nextMessages = [...existingMessages];

  for (const message of incomingMessages) {
    if (!existingIds.has(message.id)) {
      nextMessages.push(message);
      existingIds.add(message.id);
    }
  }

  return nextMessages;
}

function resolveActiveCards(messages: ChatMessage[]): DemoCard[] {
  const cards = loadCardMap();

  return messages
    .filter((message) => message.type === "card" && message.cardId)
    .map((message) => cards.get(message.cardId ?? ""))
    .filter((card): card is DemoCard => Boolean(card));
}

export function selectAutoplayAction(actions: DemoAction[]): DemoAction | undefined {
  return [...actions]
    .filter((action) => action.kind !== "scene-switch")
    .sort((left, right) => (left.autoplayPriority ?? 100) - (right.autoplayPriority ?? 100))[0];
}

function normalizeInitialOptions(
  scene: SceneDefinition,
  options: InitialStateOptions,
): Required<Exclude<InitialStateOptions, ExperienceMode>> {
  if (typeof options === "string") {
    return {
      experienceMode: options,
      runtimeMode: scene.runtimeDefault ?? "snapshot",
      triggerPreset: scene.triggerPreset ?? "balanced",
      autoplay: options === "recording",
    };
  }

  const experienceMode = options.experienceMode ?? scene.modeDefault ?? "judge";

  return {
    experienceMode,
    runtimeMode: options.runtimeMode ?? scene.runtimeDefault ?? "snapshot",
    triggerPreset: options.triggerPreset ?? scene.triggerPreset ?? "balanced",
    autoplay: options.autoplay ?? experienceMode === "recording",
  };
}

function applyRecordingFlags(
  state: DemoState,
  recording: {
    running: boolean;
    paused: boolean;
    pausePoint?: TimelinePausePoint;
  },
): DemoState {
  return {
    ...state,
    recording,
  };
}
