import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "RentApp Admin",
  description: "Gestion de alquileres",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-white text-slate-900 transition-colors duration-200 ease-out",
          "dark:bg-slate-950 dark:text-slate-100"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
