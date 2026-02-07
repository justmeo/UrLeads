export interface ChannelStatus {
  connected: boolean;
  lastConnectedAt: string | null;
  lastError: string | null;
  info?: Record<string, unknown>;
}

export const DISCONNECTED_STATUS: ChannelStatus = {
  connected: false,
  lastConnectedAt: null,
  lastError: null,
};
