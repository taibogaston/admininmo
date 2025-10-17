import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const colorMap: Record<string, string> = {
  APROBADO: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/30",
  PENDIENTE: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/30",
  RECHAZADO: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/30",
  ACTIVO: "bg-green-50 text-green-700 ring-1 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-400/30",
  INACTIVO: "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/30",
  default: "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30",
};

export const Badge = ({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
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
