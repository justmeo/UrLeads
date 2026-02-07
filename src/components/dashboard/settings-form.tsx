"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { getAuthHeaders } from "@/hooks/use-auth";

interface SettingsFormData {
  crm: {
    url: string;
    apiKey: string;
  };
  ai: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl: string;
    systemPrompt: string;
  };
}

const AI_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-20250414"],
  ollama: ["llama3.1", "llama3.1:70b", "mistral", "codellama", "mixtral"],
};

export function SettingsForm() {
  const [data, setData] = useState<SettingsFormData>({
    crm: { url: "", apiKey: "" },
    ai: { provider: "openai", apiKey: "", model: "gpt-4o", baseUrl: "", systemPrompt: "" },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/user/config", { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((config) => {
        setData({
          crm: {
            url: config.crm?.url || "",
            apiKey: config.crm?.apiKey || "",
          },
          ai: {
            provider: config.ai?.provider || "openai",
            apiKey: "", // Don't load masked key
            model: config.ai?.model || "gpt-4o",
            baseUrl: config.ai?.baseUrl || "",
            systemPrompt: config.ai?.systemPrompt || "",
          },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updates: Record<string, unknown> = {
        crm: {
          url: data.crm.url,
          ...(data.crm.apiKey ? { apiKey: data.crm.apiKey } : {}),
        },
        ai: {
          provider: data.ai.provider,
          model: data.ai.model,
          ...(data.ai.apiKey ? { apiKey: data.ai.apiKey } : {}),
          ...(data.ai.baseUrl ? { baseUrl: data.ai.baseUrl } : {}),
          ...(data.ai.systemPrompt ? { systemPrompt: data.ai.systemPrompt } : {}),
        },
      };

      const res = await fetch("/api/user/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Settings saved" });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CRM Configuration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">CRM Configuration</h2>
          <p className="text-sm text-gray-500">Enter your CRM&apos;s API base URL and credentials</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            id="crm-url"
            label="CRM API URL"
            type="url"
            placeholder="https://your-crm.com/api"
            value={data.crm.url}
            onChange={(e) => setData({ ...data, crm: { ...data.crm, url: e.target.value } })}
          />
          <Input
            id="crm-key"
            label="CRM API Key (optional)"
            type="password"
            placeholder="Your CRM API key"
            value={data.crm.apiKey}
            onChange={(e) => setData({ ...data, crm: { ...data.crm, apiKey: e.target.value } })}
          />
        </CardBody>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">AI Provider</h2>
          <p className="text-sm text-gray-500">Choose your AI provider and model</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              id="ai-provider"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={data.ai.provider}
              onChange={(e) =>
                setData({
                  ...data,
                  ai: {
                    ...data.ai,
                    provider: e.target.value,
                    model: AI_MODELS[e.target.value]?.[0] || "",
                  },
                })
              }
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (local)</option>
            </select>
          </div>

          <div>
            <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              id="ai-model"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={data.ai.model}
              onChange={(e) => setData({ ...data, ai: { ...data.ai, model: e.target.value } })}
            >
              {(AI_MODELS[data.ai.provider] || []).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {data.ai.provider !== "ollama" && (
            <Input
              id="ai-key"
              label="API Key"
              type="password"
              placeholder={`Your ${data.ai.provider === "openai" ? "OpenAI" : "Anthropic"} API key`}
              value={data.ai.apiKey}
              onChange={(e) => setData({ ...data, ai: { ...data.ai, apiKey: e.target.value } })}
            />
          )}

          {data.ai.provider === "ollama" && (
            <Input
              id="ollama-url"
              label="Ollama URL"
              type="url"
              placeholder="http://localhost:11434"
              value={data.ai.baseUrl}
              onChange={(e) => setData({ ...data, ai: { ...data.ai, baseUrl: e.target.value } })}
            />
          )}

          <div>
            <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Custom System Prompt (optional)
            </label>
            <textarea
              id="system-prompt"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Add custom instructions for your AI agent..."
              value={data.ai.systemPrompt}
              onChange={(e) =>
                setData({ ...data, ai: { ...data.ai, systemPrompt: e.target.value } })
              }
            />
          </div>
        </CardBody>
      </Card>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" loading={saving}>
        Save Settings
      </Button>
    </form>
  );
}
