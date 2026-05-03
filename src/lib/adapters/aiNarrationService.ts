import { loadCardMap } from "@/lib/fixtures/loader";

export type PlanSummary = {
  title: string;
  summary: string;
};

export type RecapInput = {
  messages: string[];
  participants: string[];
};

export type RecapOutput = {
  highlight: string;
  keywords: string[];
};

export interface AiNarrationService {
  summarizeIntent(input: string[]): Promise<PlanSummary>;
  generateRecap(input: RecapInput): Promise<RecapOutput>;
}

export const fixtureNarrationService: AiNarrationService = {
  async summarizeIntent() {
    const planCard = loadCardMap().get("plan_card_1");

    return {
      title: planCard?.title ?? "",
      summary: typeof planCard?.summary === "string" ? planCard.summary : "",
    };
  },
  async generateRecap() {
    const memoryCard = loadCardMap().get("memory_card_1");

    return {
      highlight: typeof memoryCard?.summary === "string" ? memoryCard.summary : "",
      keywords: Array.isArray(memoryCard?.keywords)
        ? memoryCard.keywords.filter((keyword): keyword is string => typeof keyword === "string")
        : [],
    };
  },
};
