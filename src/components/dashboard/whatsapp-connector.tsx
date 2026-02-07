"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useChannelStatus } from "@/hooks/use-channel-status";
import { getAuthHeaders } from "@/hooks/use-auth";

export function WhatsAppConnector() {
  const { status, refresh } = useChannelStatus("whatsapp");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConnection = async () => {
    setLoading(true);
    setError(null);
    setQrImage(null);

    try {
      const res = await fetch("/api/channels/whatsapp/qr", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start QR login");
      }

      setQrImage(data.qr);
      // Start polling status more frequently while waiting for scan
      const pollInterval = setInterval(async () => {
        await refresh();
        const currentStatus = await fetch("/api/channels/whatsapp/status", {
          headers: getAuthHeaders(),
        }).then((r) => r.json());

        if (currentStatus.connected) {
          clearInterval(pollInterval);
          setQrImage(null);
          refresh();
        }
      }, 2000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/channels/whatsapp/disconnect", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      setQrImage(null);
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
          <h3 className="text-lg font-semibold text-gray-900">WhatsApp</h3>
          <p className="text-sm text-gray-500">Connect via QR code scan</p>
        </div>
        <StatusBadge connected={status.connected} />
      </div>

      {status.connected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Connected phone: {(status.info as Record<string, string>)?.phone || "linked"}
          </p>
          <Button variant="danger" size="sm" onClick={disconnect} loading={loading}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {qrImage ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Scan this QR code in WhatsApp &rarr; Linked Devices
              </p>
              <div className="inline-block p-4 bg-white rounded-lg border border-gray-200">
                <img src={qrImage} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
              <p className="text-xs text-gray-400">QR code expires after 60 seconds</p>
            </div>
          ) : (
            <Button onClick={startConnection} loading={loading}>
              Connect WhatsApp
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {status.lastError && !error && (
        <p className="text-xs text-amber-600">{status.lastError}</p>
      )}
    </div>
  );
}
