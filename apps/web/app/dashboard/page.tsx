import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import { User, Contrato } from "@/lib/types";
import { UserRole } from "@admin-inmo/shared";
import { LogoutButton } from "@/components/LogoutButton";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";

export default async function DashboardPage() {
  let user: User;
  try {
    user = await serverApiFetch<User>("/api/auth/me");
  } catch (_error) {
    redirect("/login");
  }

  if (user.rol === UserRole.SUPER_ADMIN) {
    redirect("/dashboard/super-admin");
  }

  if (user.rol === UserRole.ADMIN) {
    redirect("/dashboard/admin/overview");
  }

  const contratos = await serverApiFetch<Contrato[]>("/api/contratos");

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">ADMIN INMO</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {user.inmobiliaria?.nombre ? `Inmobiliaria ${user.inmobiliaria.nombre}` : "Panel personal"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-slate-600 dark:text-slate-300 md:flex">
              <span aria-hidden>&bull;</span>
              <span>Hola, {user.nombre}</span>
              <span aria-hidden>&bull;</span>
              <span className="capitalize">{user.rol.toLowerCase()}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex pt-20 md:pt-24">
        <div className="flex-1 px-4 pb-12 md:px-8">
          {user.rol === UserRole.INQUILINO && <TenantDashboard contratos={contratos} />}
          {user.rol === UserRole.PROPIETARIO && <OwnerDashboard contratos={contratos} />}
        </div>
      </main>
    </div>
  );
}
