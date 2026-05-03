import type { DemoAction } from "@/lib/types/demo";

export type OutboundMessage = {
  groupId: string;
  text?: string;
  cardId?: string;
  actions?: DemoAction[];
};

export type PlatformKeyboard = {
  buttons: Array<{
    id: string;
    label: string;
  }>;
};

export interface GroupPlatformAdapter {
  sendMessage(payload: OutboundMessage): Promise<void>;
  renderKeyboard(buttons: DemoAction[]): PlatformKeyboard;
}

export const fixtureGroupAdapter: GroupPlatformAdapter = {
  async sendMessage() {
    return;
  },
  renderKeyboard(buttons) {
    return {
      buttons: buttons.map((button) => ({
        id: button.id,
        label: button.label,
      })),
    };
  },
};
