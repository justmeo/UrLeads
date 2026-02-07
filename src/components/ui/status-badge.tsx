interface StatusBadgeProps {
  connected: boolean;
  label?: string;
}

export function StatusBadge({ connected, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        connected
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          connected ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {label || (connected ? "Connected" : "Disconnected")}
    </span>
  );
}
