import React, { useId } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, id, name, ...props }) {
  const generatedId = useId();
  const resolvedId = id || generatedId;
  const resolvedName = name || resolvedId;

  return (
    <input
      id={resolvedId}
      name={resolvedName}
      className={cn(
        "flex h-10 w-full rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
