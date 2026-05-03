import type { DemoAction, DemoCard } from "@/lib/types/demo";

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

export type CardButtonModel = {
  label: string;
  action: DemoAction | undefined;
  disabled: boolean;
};

export function buildCardButtonModels(
  labels: string[],
  actions: DemoAction[],
): CardButtonModel[] {
  return labels.map((label) => {
    const action = actionForLabel(actions, label);

    return {
      label,
      action,
      disabled: !action,
    };
  });
}
