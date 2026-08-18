const sizeClasses = {
  xs: "size-4 rounded-[4px] text-[8px]",
  sm: "size-5 rounded-[5px] text-[10px]",
  md: "size-7 rounded-[7px] text-[13px]",
};

export function ProjectIcon({
  name,
  color,
  size = "sm",
  className = "",
}: {
  name: string;
  color?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-bold text-white ${sizeClasses[size]} ${className}`}
      style={{ background: color ?? "#85858c" }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
