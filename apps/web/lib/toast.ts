"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant: ToastVariant;
  duration: number;
  createdAt: number;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const timers = new Map<string, number>();

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = toast.id ?? generateId();
    const variant = toast.variant ?? "info";
    const duration = Number.isFinite(toast.duration ?? NaN) ? (toast.duration as number) : 4500;
    const entry: Toast = {
      id,
      title: toast.title,
      description: toast.description,
      variant,
      duration,
      createdAt: Date.now(),
      action: toast.action,
    };

    set((state) => ({
      toasts: [...state.toasts.filter((item) => item.id !== id), entry],
    }));

    if (duration !== Infinity && typeof window !== "undefined") {
      if (timers.has(id)) {
        window.clearTimeout(timers.get(id)!);
      }
      const timeout = window.setTimeout(() => {
        get().dismiss(id);
      }, duration);
      timers.set(id, timeout);
    }

    return id;
  },
  dismiss: (id) => {
    if (typeof window !== "undefined" && timers.has(id)) {
      window.clearTimeout(timers.get(id)!);
      timers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  dismissAll: () => {
    if (typeof window !== "undefined") {
      timers.forEach((timeout) => window.clearTimeout(timeout));
      timers.clear();
    }
    set({ toasts: [] });
  },
}));

const buildShow =
  (variant: ToastVariant) =>
  (description: string, options: Omit<ToastOptions, "description" | "variant"> = {}) =>
    useToastStore.getState().show({ description, variant, ...options });

export const toast = {
  success: buildShow("success"),
  error: buildShow("error"),
  info: buildShow("info"),
  warning: buildShow("warning"),
  custom: (options: ToastOptions) => useToastStore.getState().show(options),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  dismissAll: () => useToastStore.getState().dismissAll(),
};
