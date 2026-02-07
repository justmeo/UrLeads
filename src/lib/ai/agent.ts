import type { AIProvider, ChatMessage } from "./types";
import type { UserConfig, ChatEntry } from "@/lib/config/types";
import { createOpenAIProvider } from "./providers/openai";
import { createAnthropicProvider } from "./providers/anthropic";
import { createOllamaProvider } from "./providers/ollama";
import { CRM_TOOLS, executeTool } from "./tools/crm-tools";
import { readUserConfig } from "@/lib/storage/user-config";
import { getHistory, appendMessage } from "@/lib/storage/chat-history";

const MAX_TOOL_ROUNDS = 5;

function createProvider(aiConfig: UserConfig["ai"]): AIProvider {
  switch (aiConfig.provider) {
    case "openai":
      if (!aiConfig.apiKey) throw new Error("OpenAI API key is not configured");
      return createOpenAIProvider(aiConfig.apiKey, aiConfig.model, aiConfig.baseUrl);

    case "anthropic":
      if (!aiConfig.apiKey) throw new Error("Anthropic API key is not configured");
      return createAnthropicProvider(aiConfig.apiKey, aiConfig.model);

    case "ollama":
      return createOllamaProvider(aiConfig.baseUrl, aiConfig.model);

    default:
      throw new Error(`Unknown AI provider: ${aiConfig.provider}`);
  }
}

function buildSystemPrompt(config: UserConfig): string {
  const crmInfo = config.crm.url
    ? `\nThe user's CRM is at: ${config.crm.url}\nYou can use tools to interact with it.`
    : "\nNo CRM URL is configured yet. If the user asks about CRM operations, let them know they need to configure their CRM URL in settings first.";

  const customPrompt = config.ai.systemPrompt
    ? `\n\nCustom instructions from the user:\n${config.ai.systemPrompt}`
    : "";

  return `You are an AI CRM assistant for UrLeads. You help users manage their CRM through chat.

Your capabilities:
- Search and list contacts
- Create new leads
- View and update deals
- Add notes to contacts and deals
${crmInfo}

Be concise and professional. When performing CRM actions, confirm what you did.
If a tool call fails, explain the error clearly and suggest what the user can do.${customPrompt}`;
}

function historyToMessages(history: ChatEntry[]): ChatMessage[] {
  return history.map((entry) => ({
    role: entry.direction === "inbound" ? ("user" as const) : ("assistant" as const),
    content: entry.text,
  }));
}

export async function processAgentMessage(
  userId: string,
  inboundText: string,
  channel: "whatsapp" | "telegram",
  senderInfo: { id: string; name?: string }
): Promise<string> {
  const config = await readUserConfig(userId);
  const provider = createProvider(config.ai);

  // Load recent history for context
  const history = await getHistory(userId, 20);
  const systemPrompt = buildSystemPrompt(config);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...historyToMessages(history),
    { role: "user", content: inboundText },
  ];

  // Only provide CRM tools if CRM URL is configured
  const tools = config.crm.url ? CRM_TOOLS : undefined;

  let response = await provider.chat({
    messages,
    tools,
    model: config.ai.model,
  });

  // Tool execution loop
  let round = 0;
  while (response.tool_calls && response.tool_calls.length > 0 && round < MAX_TOOL_ROUNDS) {
    // Add assistant message with tool calls
    messages.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.tool_calls,
    });

    // Execute each tool call and add results
    for (const toolCall of response.tool_calls) {
      let result: unknown;
      try {
        result = await executeTool(toolCall, config.crm);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }

      messages.push({
        role: "tool",
        content: JSON.stringify(result),
        tool_call_id: toolCall.id,
      });
    }

    // Ask AI to continue with tool results
    response = await provider.chat({ messages, tools, model: config.ai.model });
    round++;
  }

  const replyText = response.content || "I was unable to generate a response.";

  // Save conversation to history
  await appendMessage(userId, {
    channel,
    direction: "inbound",
    from: senderInfo.name || senderInfo.id,
    text: inboundText,
    metadata: { senderId: senderInfo.id },
  });

  await appendMessage(userId, {
    channel,
    direction: "outbound",
    from: "assistant",
    text: replyText,
  });

  return replyText;
}
