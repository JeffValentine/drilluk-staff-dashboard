import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <section className={cn("rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-base font-semibold leading-tight tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}
