"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders } from "@/hooks/use-auth";

interface ChatEntry {
  id: string;
  timestamp: string;
  channel: "whatsapp" | "telegram";
  direction: "inbound" | "outbound";
  from: string;
  text: string;
}

export function ConversationList() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations?limit=100", { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900">No conversations yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect WhatsApp or Telegram and start chatting with your AI assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.direction === "outbound" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
              msg.direction === "outbound"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs opacity-75">
                {msg.channel === "whatsapp" ? "WA" : "TG"} - {msg.from}
              </span>
              <span className="text-xs opacity-50">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
