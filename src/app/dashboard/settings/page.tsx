"use client";

import { SettingsForm } from "@/components/dashboard/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <SettingsForm />
    </div>
  );
}
