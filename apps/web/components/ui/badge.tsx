import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const colorMap: Record<string, string> = {
  APROBADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
  RECHAZADO: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200",
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export const Badge = ({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
      className
    )}
    {...props}
  >
    {children}
  </span>
);

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge className={colorMap[status] ?? colorMap.default}>{status}</Badge>
);
