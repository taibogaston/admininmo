import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ADMIN_SECTIONS, AdminSection } from "@/components/dashboard/admin/sections";
import { fetchAdminDashboardData } from "../data";

interface AdminSectionPageProps {
  params: { section: string };
}

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const match = ADMIN_SECTIONS.find((item) => item.id === params.section);

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
    />
  );
}
