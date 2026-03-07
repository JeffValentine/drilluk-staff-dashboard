import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Button({ className, variant, type = "button", ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
