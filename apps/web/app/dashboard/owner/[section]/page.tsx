import { redirect } from "next/navigation";
import { OwnerDashboardWithSidebar } from "@/components/dashboard/OwnerDashboardWithSidebar";
import { OWNER_SECTIONS, OwnerSection, getOwnerSectionsForRole } from "@/components/dashboard/owner/sections";
import { serverApiFetch } from "@/lib/server-api";
import { User, Contrato } from "@/lib/types";
import { UserRole } from "@admin-inmo/shared";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface OwnerSectionPageProps {
  params: { section: string };
}

export default async function OwnerSectionPage({ params }: OwnerSectionPageProps) {
  let user: User;
  try {
    user = await serverApiFetch<User>("/api/auth/me");
  } catch (error) {
    redirect("/login");
  }

  if (user.rol !== UserRole.PROPIETARIO) {
    redirect("/dashboard");
  }

  const userSections = getOwnerSectionsForRole(user.rol);
  const match = userSections.find((item) => item.id === params.section);

  if (!match) {
    redirect("/dashboard/owner/overview");
  }

  const activeSection: OwnerSection = match.id;
  const contratos = await serverApiFetch<Contrato[]>("/api/contratos");

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">ADMIN INMO</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Panel de Propietario
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-slate-600 dark:text-slate-300 md:flex">
              <span aria-hidden>&bull;</span>
              <span>Hola, {user.nombre}</span>
              <span aria-hidden>&bull;</span>
              <span className="capitalize">{user.rol.toLowerCase()}</span>
            </div>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <OwnerDashboardWithSidebar
        activeSection={activeSection}
        contratos={contratos}
        propietarioId={user.id}
        userRole={user.rol}
      />
    </div>
  );
}
