import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[18px] border px-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "border-fuchsia-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(8,145,178,0.16),rgba(88,28,135,0.18))] hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(8,145,178,0.22),rgba(88,28,135,0.24))]",
        secondary:
          "border-white/15 bg-[linear-gradient(135deg,rgba(20,20,24,0.94),rgba(17,24,39,0.86))] text-zinc-100 hover:bg-[linear-gradient(135deg,rgba(39,39,42,0.94),rgba(31,41,55,0.9))]",
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
