"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useChannelStatus } from "@/hooks/use-channel-status";
import { getAuthHeaders } from "@/hooks/use-auth";

export function TelegramConnector() {
  const { status, refresh } = useChannelStatus("telegram");
  const [botToken, setBotToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    if (!botToken.trim()) {
      setError("Bot token is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/channels/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ botToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");

      setBotToken("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/channels/telegram/disconnect", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      refresh();
    } catch {
      setError("Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Telegram</h3>
          <p className="text-sm text-gray-500">Connect with a bot token from @BotFather</p>
        </div>
        <StatusBadge connected={status.connected} />
      </div>

      {status.connected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Bot: @{(status.info as Record<string, string>)?.botUsername || "connected"}
          </p>
          <Button variant="danger" size="sm" onClick={disconnect} loading={loading}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Get a bot token from{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500"
            >
              @BotFather
            </a>{" "}
            on Telegram, then paste it here.
          </p>
          <div className="flex gap-2">
            <Input
              id="bot-token"
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
            />
            <Button onClick={connect} loading={loading}>
              Connect
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {status.lastError && !error && (
        <p className="text-xs text-amber-600">{status.lastError}</p>
      )}
    </div>
  );
}
