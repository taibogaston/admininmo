import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import { User, Contrato, DescuentoDetalle, Transferencia } from "@/lib/types";
import { UserRole } from "@admin-inmo/shared";
import { LogoutButton } from "@/components/LogoutButton";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default async function DashboardPage() {
  let user: User;
  try {
    user = await serverApiFetch<User>("/api/auth/me");
  } catch (error) {
    redirect("/login");
  }

  const contratos = await serverApiFetch<Contrato[]>("/api/contratos");

  // Solo cargar datos adicionales para admin
  let descuentos: DescuentoDetalle[] = [];
  let transferencias: Transferencia[] = [];
  
  if (user.rol === UserRole.ADMIN) {
    descuentos = await serverApiFetch<DescuentoDetalle[]>("/api/descuentos");
    transferencias = await serverApiFetch<Transferencia[]>("/api/transferencias/pendientes");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {user.nombre}</h1>
          <p className="text-sm text-slate-600">Rol: {user.rol}</p>
        </div>
        <LogoutButton />
      </header>

      {user.rol === UserRole.INQUILINO && <TenantDashboard contratos={contratos} />}
      {user.rol === UserRole.PROPIETARIO && <OwnerDashboard contratos={contratos} />}
      {user.rol === UserRole.ADMIN && (
        <AdminDashboard 
          contratos={contratos} 
          descuentos={descuentos} 
          transferencias={transferencias} 
        />
      )}
    </div>
  );
}
