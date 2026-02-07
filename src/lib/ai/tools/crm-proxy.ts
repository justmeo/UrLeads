import type { UserConfig } from "@/lib/config/types";

export async function callCrmApi(
  crmConfig: UserConfig["crm"],
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  if (!crmConfig.url) {
    throw new Error("CRM URL is not configured");
  }

  const url = `${crmConfig.url.replace(/\/+$/, "")}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(crmConfig.apiKey ? { Authorization: `Bearer ${crmConfig.apiKey}` } : {}),
    ...(crmConfig.headers || {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `CRM API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
