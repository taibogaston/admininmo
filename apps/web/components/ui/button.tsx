import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md focus-visible:ring-primary/50 dark:hover:bg-primary/80",
        outline:
          "border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md focus-visible:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:border-slate-500",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-none focus-visible:ring-primary/30 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus-visible:ring-red-500/50 dark:bg-red-700 dark:hover:bg-red-600",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = "Button";

export { Button, buttonVariants };
