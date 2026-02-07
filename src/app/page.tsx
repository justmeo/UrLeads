import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">UrLeads</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl font-bold text-gray-900 leading-tight">
          Control your CRM
          <br />
          from WhatsApp & Telegram
        </h2>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Connect your AI agent to your CRM and manage contacts, leads, and deals
          through simple chat messages. No app switching, no dashboards.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Chat-first CRM</h3>
            <p className="mt-2 text-sm text-gray-600">
              Send a message on WhatsApp or Telegram and your AI agent will update your CRM automatically. Create leads, update deals, add notes - all through chat.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bring your own AI</h3>
            <p className="mt-2 text-sm text-gray-600">
              Use OpenAI, Anthropic, or run Ollama locally. Plug in your API key or use one of the pre-configured providers. Your data stays under your control.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-gray-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Any CRM</h3>
            <p className="mt-2 text-sm text-gray-600">
              Connect any CRM with a REST API. Just enter your CRM URL and API key. Works with HubSpot, Salesforce, Pipedrive, and custom-built CRMs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          UrLeads - AI-powered CRM control through messaging
        </div>
      </footer>
    </div>
  );
}
