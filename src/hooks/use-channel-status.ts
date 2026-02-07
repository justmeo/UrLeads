"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "./use-auth";
import type { ChannelStatus } from "@/lib/channels/types";

const POLL_INTERVAL = 5000;

export function useChannelStatus(channel: "whatsapp" | "telegram") {
  const [status, setStatus] = useState<ChannelStatus>({
    connected: false,
    lastConnectedAt: null,
    lastError: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channel}/status`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Ignore fetch errors during polling
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, refresh: fetchStatus };
}
