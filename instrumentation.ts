export async function register() {
  // Only run on the server (not in edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { recoverChannels } = await import("@/lib/channels/startup");

    // Delay recovery slightly to let the server finish starting
    setTimeout(() => {
      recoverChannels().catch((err) => {
        console.error("[instrumentation] Channel recovery failed:", err);
      });
    }, 3000);
  }
}
