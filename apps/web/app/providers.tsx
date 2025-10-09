"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const Providers = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
