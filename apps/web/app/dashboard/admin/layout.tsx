import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import { User } from "@/lib/types";
import { UserRole } from "@admin-inmo/shared";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  let user: User;
  try {
    user = await serverApiFetch<User>("/api/auth/me");
  } catch (error) {
    redirect("/login");
  }

  if (user.rol !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">ADMIN INMO</h1>
            <div className="hidden items-center gap-2 text-sm text-slate-600 dark:text-slate-300 md:flex">
              <span aria-hidden>&bull;</span>
              <span>Hola, {user.nombre}</span>
              <span aria-hidden>&bull;</span>
              <span className="capitalize">{user.rol.toLowerCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex pt-16">{children}</div>
    </div>
  );
}
