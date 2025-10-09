"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { Toast, ToastVariant, useToastStore } from "@/lib/toast";
import { cn } from "@/lib/utils";

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-emerald-300/70 bg-white/90 dark:border-emerald-500/40 dark:bg-slate-900/90 dark:text-emerald-100",
  error: "border-rose-300/70 bg-white/90 dark:border-rose-500/40 dark:bg-slate-900/90 dark:text-rose-100",
  info: "border-sky-300/70 bg-white/90 dark:border-sky-500/40 dark:bg-slate-900/90 dark:text-sky-100",
  warning:
    "border-amber-300/70 bg-white/90 dark:border-amber-500/40 dark:bg-slate-900/90 dark:text-amber-100",
};

const variantIcon: Record<ToastVariant, JSX.Element> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />,
  error: <AlertOctagon className="h-5 w-5 text-rose-500 dark:text-rose-300" />,
  info: <Info className="h-5 w-5 text-sky-500 dark:text-sky-300" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-300" />,
};

const variantAccent: Record<ToastVariant, string> = {
  success: "before:bg-emerald-400/90 dark:before:bg-emerald-500/80",
  error: "before:bg-rose-400/90 dark:before:bg-rose-500/80",
  info: "before:bg-sky-400/90 dark:before:bg-sky-500/80",
  warning: "before:bg-amber-400/90 dark:before:bg-amber-500/80",
};

export const Toaster = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
  const icon = variantIcon[toast.variant];

  const handleClose = () => {
    onDismiss();
  };

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
      onDismiss();
    }
  };

  return (
    <div
      className={cn(
        "toast-card pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-white/95 p-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md animate-toast-in",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:content-['']",
        variantStyles[toast.variant],
        variantAccent[toast.variant]
      )}
    >
      <div className="relative flex gap-3">
        <div className="mt-1 flex h-6 w-6 items-center justify-center">{icon}</div>
        <div className="flex-1 space-y-1">
          {toast.title && <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>}
          <p className="text-sm leading-5 text-slate-700 dark:text-slate-200">{toast.description}</p>
          {toast.action && (
            <button
              type="button"
              onClick={handleAction}
              className="mt-1 inline-flex text-sm font-medium text-slate-900 underline-offset-4 transition hover:underline dark:text-white"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar notificacion"
          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-slate-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
