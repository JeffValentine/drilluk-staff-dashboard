import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
