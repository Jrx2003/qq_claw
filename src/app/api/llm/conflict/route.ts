import { handleLlmTaskRoute } from "@/lib/llm/routeHandler";

export async function POST(request: Request) {
  return handleLlmTaskRoute("conflict", request);
}
