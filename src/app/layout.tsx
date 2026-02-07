import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UrLeads - AI-Powered CRM Control",
  description: "Control your CRM through WhatsApp and Telegram with AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
