import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ClipboardList, FileText, Percent, ArrowLeftRight, Settings } from "lucide-react";
import { UserRole } from "@admin-inmo/shared";

export type AdminSection = "overview" | "users" | "assign" | "contracts" | "discounts" | "transfers" | "configuracion-pagos";

export interface AdminSectionConfig {
  id: AdminSection;
  label: string;
  icon: LucideIcon;
  roles: UserRole[]; // Roles que pueden ver esta sección
}

export const ADMIN_SECTIONS: readonly AdminSectionConfig[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: "users", label: "Usuarios", icon: Users, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: "assign", label: "Asignar contrato", icon: ClipboardList, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: "contracts", label: "Contratos", icon: FileText, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: "discounts", label: "Descuentos", icon: Percent, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: "transfers", label: "Transferencias", icon: ArrowLeftRight, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: "configuracion-pagos", label: "Configuración de Pagos", icon: Settings, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
] as const;

export const getAdminSectionsForRole = (role: UserRole): AdminSectionConfig[] => {
  return ADMIN_SECTIONS.filter(section => section.roles.includes(role));
};
