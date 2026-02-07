import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ChatParams, AIResponse, ChatMessage, ToolDefinition } from "../types";

export function createAnthropicProvider(
  apiKey: string,
  defaultModel?: string
): AIProvider {
  const client = new Anthropic({ apiKey });

  return {
    async chat(params: ChatParams): Promise<AIResponse> {
      // Extract system message
      const systemMsg = params.messages.find((m) => m.role === "system");
      const nonSystemMessages = params.messages.filter((m) => m.role !== "system");

      const response = await client.messages.create({
        model: params.model || defaultModel || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        ...(systemMsg?.content ? { system: systemMsg.content } : {}),
        messages: nonSystemMessages.map((m) => formatAnthropicMessage(m)),
        ...(params.tools?.length
          ? { tools: params.tools.map((t) => formatAnthropicTool(t)) }
          : {}),
      });

      // Parse response: extract text and tool_use blocks
      let content: string | null = null;
      const toolCalls: AIResponse["tool_calls"] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          content = (content || "") + block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            type: "function",
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          });
        }
      }

      return {
        content,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    },
  };
}

function formatAnthropicMessage(
  msg: ChatMessage
): Anthropic.MessageParam {
  if (msg.role === "tool") {
    return {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: msg.tool_call_id || "",
          content: msg.content || "",
        },
      ],
    };
  }

  if (msg.role === "assistant" && msg.tool_calls?.length) {
    const content: Anthropic.ContentBlockParam[] = [];
    if (msg.content) {
      content.push({ type: "text", text: msg.content });
    }
    for (const tc of msg.tool_calls) {
      content.push({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
      });
    }
    return { role: "assistant", content };
  }

  return {
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content || "",
  };
}

function formatAnthropicTool(
  tool: ToolDefinition
): Anthropic.Tool {
  return {
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters as Anthropic.Tool["input_schema"],
  };
}
