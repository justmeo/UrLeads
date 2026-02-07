"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useChannelStatus } from "@/hooks/use-channel-status";

export default function DashboardPage() {
  const { status: waStatus } = useChannelStatus("whatsapp");
  const { status: tgStatus } = useChannelStatus("telegram");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">WhatsApp</h3>
              <StatusBadge connected={waStatus.connected} />
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-lg font-semibold text-gray-900">
              {waStatus.connected
                ? `Connected (${(waStatus.info as Record<string, string>)?.phone || "linked"})`
                : "Not connected"}
            </p>
            {waStatus.lastError && (
              <p className="mt-1 text-xs text-red-500">{waStatus.lastError}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Telegram</h3>
              <StatusBadge connected={tgStatus.connected} />
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-lg font-semibold text-gray-900">
              {tgStatus.connected
                ? `@${(tgStatus.info as Record<string, string>)?.botUsername || "bot"}`
                : "Not connected"}
            </p>
            {tgStatus.lastError && (
              <p className="mt-1 text-xs text-red-500">{tgStatus.lastError}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">Quick Start</h3>
          </CardHeader>
          <CardBody>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Configure your CRM in Settings</li>
              <li>Add your AI API key in Settings</li>
              <li>Connect WhatsApp or Telegram in Channels</li>
              <li>Start chatting to control your CRM</li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
