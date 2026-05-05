import type { CardActionBinding, DemoAction, DemoCard } from "@/lib/types/demo";

export function cardString(card: DemoCard, key: string, fallback = ""): string {
  const value = card[key];
  return typeof value === "string" ? value : fallback;
}

export function cardNumber(card: DemoCard, key: string, fallback = 0): number {
  const value = card[key];
  return typeof value === "number" ? value : fallback;
}

export function cardStringArray(card: DemoCard, key: string): string[] {
  const value = card[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function cardButtons(card: DemoCard): CardActionBinding[] {
  return card.buttons ?? [];
}

export type VoteRow = {
  label: string;
  votes: number;
  percent: number;
};

export function cardVoteRows(card: DemoCard, key: string): VoteRow[] {
  const value = card[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is VoteRow => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const row = item as Record<string, unknown>;
    return (
      typeof row.label === "string" &&
      typeof row.votes === "number" &&
      typeof row.percent === "number"
    );
  });
}

export function actionForLabel(actions: DemoAction[], label: string) {
  return actions.find((action) => action.label === label);
}

export function actionForBinding(actions: DemoAction[], binding: CardActionBinding) {
  if (!binding.actionId) {
    return undefined;
  }

  return actions.find((action) => action.actionId === binding.actionId || action.id === binding.actionId);
}

export type CardButtonModel = {
  label: string;
  action: DemoAction | undefined;
  disabled: boolean;
};

export function buildCardButtonModels(
  buttons: CardActionBinding[],
  actions: DemoAction[],
): CardButtonModel[] {
  return buttons.map((binding) => {
    const action = actionForBinding(actions, binding);

    return {
      label: binding.label,
      action,
      disabled: !action,
    };
  });
}
