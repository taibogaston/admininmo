import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, Building2, ArrowLeftRight } from "lucide-react";
import { UserRole } from "@admin-inmo/shared";

export type SuperAdminSection = "overview" | "inmobiliarias" | "transferencias";

export interface SuperAdminSectionConfig {
  id: SuperAdminSection;
  label: string;
  icon: LucideIcon;
}

export const SUPER_ADMIN_SECTIONS: readonly SuperAdminSectionConfig[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "inmobiliarias", label: "Inmobiliarias", icon: Building2 },
  { id: "transferencias", label: "Transferencias", icon: ArrowLeftRight },
] as const;
