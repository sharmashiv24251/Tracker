import { STATUS_CONFIG, Status } from "@/lib/status";

export function StatusDot({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: c.colorVar }}
    />
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium"
      style={{ color: c.colorVar, background: c.bgVar }}
    >
      <StatusDot status={status} />
      {c.label}
    </span>
  );
}
