const PALETTE = [
  "#5c6ce0",
  "#1a9e6f",
  "#c8760a",
  "#e5484d",
  "#0891b2",
  "#a855f7",
  "#d6409f",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
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
