import type { TriggerPreset } from "@/lib/types/demo";

export type TriggerPolicy = {
  preset: TriggerPreset;
  allowSuggestion: boolean;
  requireUserConfirmation: boolean;
  allowDirectPublicPost: boolean;
  hideTriggerUser: boolean;
};

export function resolveTriggerPolicy(preset: TriggerPreset): TriggerPolicy {
  if (preset === "conservative") {
    return {
      preset,
      allowSuggestion: false,
      requireUserConfirmation: true,
      allowDirectPublicPost: false,
      hideTriggerUser: false,
    };
  }

  if (preset === "active_host") {
    return {
      preset,
      allowSuggestion: true,
      requireUserConfirmation: false,
      allowDirectPublicPost: true,
      hideTriggerUser: true,
    };
  }

  if (preset === "conflict_safe") {
    return {
      preset,
      allowSuggestion: true,
      requireUserConfirmation: true,
      allowDirectPublicPost: false,
      hideTriggerUser: true,
    };
  }

  return {
    preset,
    allowSuggestion: true,
    requireUserConfirmation: true,
    allowDirectPublicPost: false,
    hideTriggerUser: false,
  };
}
