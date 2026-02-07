import type { ToolDefinition, ToolCall } from "../types";
import type { UserConfig } from "@/lib/config/types";
import { callCrmApi } from "./crm-proxy";

export const CRM_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_contacts",
      description: "Retrieve contacts from the CRM. Optionally filter by name or email.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Search term for name or email" },
          limit: { type: "number", description: "Max number of results to return (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead/contact in the CRM.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the lead" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          source: { type: "string", description: "Lead source (e.g. WhatsApp, website)" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_deal",
      description: "Update a deal or opportunity in the CRM.",
      parameters: {
        type: "object",
        properties: {
          dealId: { type: "string", description: "The ID of the deal to update" },
          stage: { type: "string", description: "New stage (e.g. qualified, proposal, closed-won)" },
          value: { type: "number", description: "Deal value in currency" },
          notes: { type: "string", description: "Notes about the update" },
        },
        required: ["dealId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_deals",
      description: "List deals/opportunities from the CRM, optionally filtered.",
      parameters: {
        type: "object",
        properties: {
          stage: { type: "string", description: "Filter by deal stage" },
          contactId: { type: "string", description: "Filter by contact ID" },
          limit: { type: "number", description: "Max number of results (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_note",
      description: "Add a note to a contact or deal in the CRM.",
      parameters: {
        type: "object",
        properties: {
          entityType: {
            type: "string",
            enum: ["contact", "deal"],
            description: "Whether to add note to a contact or deal",
          },
          entityId: { type: "string", description: "The ID of the contact or deal" },
          note: { type: "string", description: "The note content" },
        },
        required: ["entityType", "entityId", "note"],
      },
    },
  },
];

export async function executeTool(
  toolCall: ToolCall,
  crmConfig: UserConfig["crm"]
): Promise<unknown> {
  const args = JSON.parse(toolCall.function.arguments);
  const endpoints = crmConfig.endpoints || {};

  switch (toolCall.function.name) {
    case "get_contacts": {
      const path = endpoints.contacts || "/contacts";
      const params = new URLSearchParams();
      if (args.search) params.set("search", args.search);
      if (args.limit) params.set("limit", String(args.limit));
      const query = params.toString();
      return callCrmApi(crmConfig, "GET", `${path}${query ? `?${query}` : ""}`);
    }

    case "create_lead": {
      const path = endpoints.leads || "/leads";
      return callCrmApi(crmConfig, "POST", path, args);
    }

    case "update_deal": {
      const path = endpoints.deals || "/deals";
      const { dealId, ...updateData } = args;
      return callCrmApi(crmConfig, "PUT", `${path}/${dealId}`, updateData);
    }

    case "get_deals": {
      const path = endpoints.deals || "/deals";
      const params = new URLSearchParams();
      if (args.stage) params.set("stage", args.stage);
      if (args.contactId) params.set("contactId", args.contactId);
      if (args.limit) params.set("limit", String(args.limit));
      const query = params.toString();
      return callCrmApi(crmConfig, "GET", `${path}${query ? `?${query}` : ""}`);
    }

    case "add_note": {
      const path = endpoints.notes || "/notes";
      return callCrmApi(crmConfig, "POST", path, args);
    }

    default:
      return { error: `Unknown tool: ${toolCall.function.name}` };
  }
}
