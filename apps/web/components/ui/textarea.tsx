import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles
        "flex min-h-[100px] w-full rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-900",
        // Shadow and transitions
        "shadow-sm transition-all duration-200",
        // Focus states
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        // Hover states
        "hover:border-slate-400 hover:shadow-md",
        // Border
        "border-slate-300",
        // Placeholder
        "placeholder:text-slate-400 placeholder:font-normal",
        // Dark mode
        "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100",
        "dark:hover:border-slate-500",
        "dark:focus:ring-primary/30 dark:focus:border-primary",
        "dark:placeholder:text-slate-500",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600",
        // Resize
        "resize-y",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
