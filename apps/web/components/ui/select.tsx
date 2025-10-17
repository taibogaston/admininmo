import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
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
      // Cursor
      "cursor-pointer",
      // Appearance
      "appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23475569%22%20d%3D%22M10.293%203.293%206%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10",
      // Dark mode
      "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100",
      "dark:hover:border-slate-500 dark:hover:bg-slate-750",
      "dark:focus:ring-primary/30 dark:focus:border-primary",
      // Dark mode arrow
      "dark:bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3cpath%20fill%3D%22%23cbd5e1%22%20d%3D%22M10.293%203.293%206%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')]",
      // Options styling
      "[&>option]:bg-white [&>option]:text-slate-900 [&>option]:py-2 [&>option]:px-2",
      "dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100",
      "[&>option:checked]:bg-primary/10 [&>option:checked]:text-primary",
      "dark:[&>option:checked]:bg-primary/20",
      // Disabled state
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 dark:disabled:hover:border-slate-600",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
