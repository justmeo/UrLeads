import { createOpenAIProvider } from "./openai";
import type { AIProvider } from "../types";

export function createOllamaProvider(
  baseUrl?: string,
  defaultModel?: string
): AIProvider {
  // Ollama exposes an OpenAI-compatible API at /v1
  const ollamaBaseUrl = (baseUrl || "http://localhost:11434") + "/v1";
  return createOpenAIProvider("ollama", defaultModel || "llama3.1", ollamaBaseUrl);
}
