"use client";

import { Card, CardBody } from "@/components/ui/card";
import { WhatsAppConnector } from "@/components/dashboard/whatsapp-connector";
import { TelegramConnector } from "@/components/dashboard/telegram-connector";

export default function ChannelsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
      <p className="text-sm text-gray-600">
        Connect WhatsApp and Telegram to control your CRM through chat.
      </p>

      <Card>
        <CardBody>
          <WhatsAppConnector />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <TelegramConnector />
        </CardBody>
      </Card>
    </div>
  );
}
