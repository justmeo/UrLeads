export interface UserConfig {
  userId: string;
  email: string;
  createdAt: string;

  crm: {
    url: string;
    apiKey?: string;
    headers?: Record<string, string>;
    endpoints?: {
      contacts?: string;
      leads?: string;
      deals?: string;
      notes?: string;
    };
  };

  ai: {
    provider: "openai" | "anthropic" | "ollama";
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    systemPrompt?: string;
  };

  channels: {
    whatsapp?: {
      enabled: boolean;
      mode: "personal" | "system";
      connectedPhone?: string;
    };
    telegram?: {
      enabled: boolean;
      mode: "personal" | "system";
      botToken?: string;
      botUsername?: string;
    };
  };
}

export interface ChatEntry {
  id: string;
  timestamp: string;
  channel: "whatsapp" | "telegram";
  direction: "inbound" | "outbound";
  from: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface UserRecord {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export const DEFAULT_USER_CONFIG: Omit<UserConfig, "userId" | "email" | "createdAt"> = {
  crm: {
    url: "",
    endpoints: {
      contacts: "/contacts",
      leads: "/leads",
      deals: "/deals",
      notes: "/notes",
    },
  },
  ai: {
    provider: "openai",
    model: "gpt-4o",
  },
  channels: {},
};
