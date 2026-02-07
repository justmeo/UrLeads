export interface AIProvider {
  chat(params: ChatParams): Promise<AIResponse>;
}

export interface ChatParams {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  model?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIResponse {
  content: string | null;
  tool_calls?: ToolCall[];
}
