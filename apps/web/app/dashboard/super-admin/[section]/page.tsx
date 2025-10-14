import { redirect } from "next/navigation";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { SUPER_ADMIN_SECTIONS, SuperAdminSection } from "@/components/dashboard/super-admin/sections";
import { serverApiFetch } from "@/lib/server-api";
import { InmobiliariaWithCounts } from "@/lib/types";

interface SuperAdminSectionPageProps {
  params: { section: string };
}

export default async function SuperAdminSectionPage({ params }: SuperAdminSectionPageProps) {
  const match = SUPER_ADMIN_SECTIONS.find((item) => item.id === params.section);

  if (!match) {
    redirect("/dashboard/super-admin/overview");
  }

  const activeSection: SuperAdminSection = match.id;
  const inmobiliarias = await serverApiFetch<InmobiliariaWithCounts[]>("/api/inmobiliarias");

  return (
    <SuperAdminDashboard
      activeSection={activeSection}
      inmobiliarias={inmobiliarias}
    />
  );
}
