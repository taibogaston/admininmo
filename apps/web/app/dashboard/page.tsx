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
  } catch (error) {
    redirect("/login");
  }

  if (user.rol === UserRole.ADMIN) {
    redirect("/dashboard/admin/overview");
  }

  const contratos = await serverApiFetch<Contrato[]>("/api/contratos");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900">ADMIN INMO</h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <span>•</span>
              <span>Hola, {user.nombre}</span>
              <span>•</span>
              <span className="capitalize">{user.rol.toLowerCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Layout principal con sidebar y contenido */}
      <div className="flex pt-16">
        {user.rol === UserRole.INQUILINO && <TenantDashboard contratos={contratos} />}
        {user.rol === UserRole.PROPIETARIO && <OwnerDashboard contratos={contratos} />}
      </div>
    </div>
  );
}
