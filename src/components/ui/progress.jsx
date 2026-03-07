import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-800", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      {...props}
    >
      <div
        className="h-full rounded-full bg-fuchsia-500 transition-all"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
