import anonymousCardJson from "../../../fixtures/cards/anonymous_card.json";
import confirmCardJson from "../../../fixtures/cards/confirm_card.json";
import conflictCardJson from "../../../fixtures/cards/conflict_card.json";
import gameMemoryCardJson from "../../../fixtures/cards/game_memory_card.json";
import gamePartyCardJson from "../../../fixtures/cards/game_party_card.json";
import memoryCardJson from "../../../fixtures/cards/memory_card.json";
import planCardJson from "../../../fixtures/cards/plan_card.json";
import voteCardJson from "../../../fixtures/cards/vote_card.json";
import npcProfilesJson from "../../../fixtures/npcs/npc_profiles.json";
import anonymousSceneJson from "../../../fixtures/scenes/anonymous_delegate.json";
import conflictSceneJson from "../../../fixtures/scenes/conflict_bridge.json";
import dinnerSceneJson from "../../../fixtures/scenes/dinner_core.json";
import gameHokSceneJson from "../../../fixtures/scenes/game_party_hok.json";
import sceneManifestJson from "../../../fixtures/scenes/scene_manifest.json";
import {
  actorSchema,
  demoCardSchema,
  sceneDefinitionSchema,
  sceneIdSchema,
  sceneManifestSchema,
  type Actor,
  type DemoCard,
  type SceneDefinition,
  type SceneId,
  type SceneManifest,
} from "../types/demo";

const sceneRegistry = {
  dinner_core: dinnerSceneJson,
  anonymous_delegate: anonymousSceneJson,
  conflict_bridge: conflictSceneJson,
  game_party_hok: gameHokSceneJson,
} satisfies Record<SceneId, unknown>;

const cardRegistry = [
  planCardJson,
  voteCardJson,
  confirmCardJson,
  memoryCardJson,
  anonymousCardJson,
  conflictCardJson,
  gamePartyCardJson,
  gameMemoryCardJson,
] satisfies unknown[];

export function loadSceneManifest(): SceneManifest {
  return sceneManifestSchema.parse(sceneManifestJson);
}

export function loadScene(sceneId: SceneId | string): SceneDefinition {
  const parsedSceneId = sceneIdSchema.parse(sceneId);
  return sceneDefinitionSchema.parse(sceneRegistry[parsedSceneId]);
}

export function loadScenes(): SceneDefinition[] {
  return loadSceneManifest().scenes.map((scene) => loadScene(scene.id));
}

export function loadCards(): DemoCard[] {
  return cardRegistry.map((card) => demoCardSchema.parse(card));
}

export function loadCardMap(): Map<string, DemoCard> {
  return new Map(loadCards().map((card) => [card.id, card]));
}

export function loadActors(): Actor[] {
  return npcProfilesJson.actors.map((actor) => actorSchema.parse(actor));
}

export function loadActorMap(): Map<string, Actor> {
  return new Map(loadActors().map((actor) => [actor.id, actor]));
}
