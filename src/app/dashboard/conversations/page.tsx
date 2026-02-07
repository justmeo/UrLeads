"use client";

import { Card, CardBody } from "@/components/ui/card";
import { ConversationList } from "@/components/dashboard/conversation-list";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
      <p className="text-sm text-gray-600">
        View your recent AI-powered CRM conversations.
      </p>

      <Card>
        <CardBody>
          <ConversationList />
        </CardBody>
      </Card>
    </div>
  );
}
