import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-lg border border-slate-200 bg-white p-6 shadow-sm",
      className
    )}
    {...props}
  />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-slate-600", className)} {...props} />
);
