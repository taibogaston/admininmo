import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "RentApp Admin",
  description: "Gestión de alquileres",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={cn("min-h-screen bg-slate-50")}>{children}</body>
    </html>
  );
}
