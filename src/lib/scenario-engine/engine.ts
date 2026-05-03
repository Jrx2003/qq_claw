import { loadCardMap } from "../fixtures/loader";
import type {
  AppMode,
  ChatMessage,
  DemoAction,
  DemoCard,
  DemoState,
  DemoStep,
  SceneDefinition,
} from "../types/demo";

const preferredAutoplayActionIds = ["a1", "b_action_1", "c_action_1", "d_action_1"];

export function createInitialDemoState(
  scene: SceneDefinition,
  mode: AppMode = scene.modeDefault ?? "guided",
): DemoState {
  const entryStep = findStep(scene, scene.entryStepId);

  return applyStep(
    {
      mode,
      sceneId: scene.id,
      currentStepId: entryStep.id,
      playedStepIds: [],
      messages: [],
      activeCards: [],
      availableActions: [],
      flags: {},
    },
    entryStep,
  );
}

export function advanceStep(
  scene: SceneDefinition,
  state: DemoState,
  actionId: string,
): DemoState {
  const action = state.availableActions.find((candidate) => candidate.id === actionId);

  if (!action) {
    throw new Error(`Action "${actionId}" is not available at step "${state.currentStepId}".`);
  }

  const nextStep = findStep(scene, action.nextStepId);

  if (nextStep.id === scene.entryStepId) {
    return createInitialDemoState(scene, state.mode);
  }

  return applyStep(state, nextStep);
}

export function goToStep(scene: SceneDefinition, state: DemoState, stepId: string): DemoState {
  const nextStep = findStep(scene, stepId);

  if (nextStep.id === scene.entryStepId) {
    return createInitialDemoState(scene, state.mode);
  }

  return applyStep(state, nextStep);
}

export function runAutoplayPath(scene: SceneDefinition): DemoState {
  let state = createInitialDemoState(scene, "autoplay");
  const visited = new Set<string>();

  while (state.currentStepId !== "scene_e_memory") {
    if (visited.has(state.currentStepId)) {
      throw new Error(`Autoplay reached a loop at step "${state.currentStepId}".`);
    }

    visited.add(state.currentStepId);

    const action = selectAutoplayAction(state.availableActions);

    if (!action) {
      throw new Error(`Autoplay has no usable action at step "${state.currentStepId}".`);
    }

    state = advanceStep(scene, state, action.id);
  }

  return state;
}

export function findStep(scene: SceneDefinition, stepId: string): DemoStep {
  const step = scene.steps.find((candidate) => candidate.id === stepId);

  if (!step) {
    throw new Error(`Scene "${scene.id}" does not define step "${stepId}".`);
  }

  return step;
}

function applyStep(state: DemoState, step: DemoStep): DemoState {
  const messages = appendUniqueMessages(state.messages, step.autoMessages ?? []);
  const activeCards = resolveActiveCards(messages);

  return {
    ...state,
    currentStepId: step.id,
    playedStepIds: Array.from(new Set([...state.playedStepIds, step.id])),
    messages,
    activeCards,
    availableActions: step.availableActions ?? [],
    flags: {
      ...state.flags,
      ...(step.setFlags ?? {}),
    },
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
  for (const id of preferredAutoplayActionIds) {
    const action = actions.find((candidate) => candidate.id === id);

    if (action) {
      return action;
    }
  }

  return actions.find((action) => action.kind !== "scene-switch");
}
