import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const isDateInput = type === "date" || type === "datetime-local" || type === "time" || type === "month" || type === "week";
  
  return (
    <input
      type={type}
      className={cn(
        // Base styles
        "flex h-11 w-full rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-slate-900",
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
        // Dark mode base
        "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100",
        "dark:hover:border-slate-500",
        "dark:focus:ring-primary/30 dark:focus:border-primary",
        "dark:placeholder:text-slate-500",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600",
        // File input specific
        type === "file" && "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/20 dark:hover:file:bg-primary/30 cursor-pointer",
        // Date/Calendar input specific styles
        isDateInput && [
          // Calendar icon styles
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:opacity-70",
          "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
          "[&::-webkit-calendar-picker-indicator]:w-5",
          "[&::-webkit-calendar-picker-indicator]:h-5",
          "[&::-webkit-calendar-picker-indicator]:p-0",
          "[&::-webkit-calendar-picker-indicator]:transition-all",
          // Dark mode calendar icon - filter to make it lighter
          "dark:[&::-webkit-calendar-picker-indicator]:brightness-[10]",
          "dark:[&::-webkit-calendar-picker-indicator]:contrast-[0.5]",
          // Better text appearance for dates
          "tabular-nums",
        ],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
