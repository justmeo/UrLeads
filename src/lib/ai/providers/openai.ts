import OpenAI from "openai";
import type { AIProvider, ChatParams, AIResponse, ChatMessage } from "../types";

export function createOpenAIProvider(
  apiKey: string,
  defaultModel?: string,
  baseUrl?: string
): AIProvider {
  const client = new OpenAI({
    apiKey,
    ...(baseUrl ? { baseURL: baseUrl } : {}),
  });

  return {
    async chat(params: ChatParams): Promise<AIResponse> {
      const response = await client.chat.completions.create({
        model: params.model || defaultModel || "gpt-4o",
        messages: params.messages.map((m) => formatMessage(m)),
        ...(params.tools?.length ? { tools: params.tools } : {}),
      });

      const choice = response.choices[0];
      return {
        content: choice.message.content,
        tool_calls: choice.message.tool_calls?.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      };
    },
  };
}

function formatMessage(msg: ChatMessage): OpenAI.ChatCompletionMessageParam {
  if (msg.role === "tool") {
    return {
      role: "tool",
      content: msg.content || "",
      tool_call_id: msg.tool_call_id || "",
    };
  }
  if (msg.role === "assistant" && msg.tool_calls?.length) {
    return {
      role: "assistant",
      content: msg.content,
      tool_calls: msg.tool_calls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    };
  }
  return {
    role: msg.role as "system" | "user" | "assistant",
    content: msg.content || "",
  };
}
