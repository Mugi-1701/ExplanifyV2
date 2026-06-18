import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-violet-400/40 focus-visible:ring-2 focus-visible:ring-violet-500/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-violet-400/20 bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-[0_18px_50px_-24px_rgba(168,85,247,0.8)] hover:brightness-110",
        outline:
          "border-white/10 bg-white/5 text-white/85 hover:border-white/15 hover:bg-white/10 hover:text-white",
        secondary:
          "border-white/10 bg-white/10 text-white hover:bg-white/15",
        ghost: "text-white/75 hover:bg-white/10 hover:text-white",
        destructive:
          "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-rose-50",
        link: "text-violet-200 underline-offset-4 hover:text-violet-100 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-2 px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-4 text-sm",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-xl",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
