const PALETTE = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f97316", // Orange
];

const KNOWN_COLORS: Record<string, string> = {
  "shivansh": "#6366f1",
  "shivansh sharma": "#6366f1",
  "saransh": "#10b981",
  "saransh haseeja": "#10b981",
};

function colorForName(name: string) {
  const normalized = name.trim().toLowerCase();
  if (KNOWN_COLORS[normalized]) {
    return KNOWN_COLORS[normalized];
  }
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) + name.charCodeAt(i);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-[12px]",
  lg: "size-12 text-[16px]",
};

export function Avatar({
  name,
  size = "sm",
  className = "",
}: {
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <div
      title={name}
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface ${className}`}
      style={{ background: colorForName(name) }}
    >
      {initials(name)}
    </div>
  );
}
