import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ADMIN_SECTIONS, AdminSection, getAdminSectionsForRole } from "@/components/dashboard/admin/sections";
import { fetchAdminDashboardData } from "../data";
import { serverApiFetch } from "@/lib/server-api";
import { User } from "@/lib/types";

interface AdminSectionPageProps {
  params: { section: string };
}

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  let user: User;
  try {
    user = await serverApiFetch<User>("/api/auth/me");
  } catch (error) {
    redirect("/login");
  }

  const userSections = getAdminSectionsForRole(user.rol);
  const match = userSections.find((item) => item.id === params.section);

  if (!match) {
    redirect("/dashboard/admin/overview");
  }

  const activeSection: AdminSection = match.id;
  const { contratos, descuentos, transferencias } = await fetchAdminDashboardData();

  return (
    <AdminDashboard
      activeSection={activeSection}
      contratos={contratos}
      descuentos={descuentos}
      transferencias={transferencias}
      userRole={user.rol}
    />
  );
}
