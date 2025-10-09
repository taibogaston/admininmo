import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ClipboardList, FileText, Percent, ArrowLeftRight } from "lucide-react";

export type AdminSection = "overview" | "users" | "assign" | "contracts" | "discounts" | "transfers";

export interface AdminSectionConfig {
  id: AdminSection;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_SECTIONS: readonly AdminSectionConfig[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "assign", label: "Asignar contrato", icon: ClipboardList },
  { id: "contracts", label: "Contratos", icon: FileText },
  { id: "discounts", label: "Descuentos", icon: Percent },
  { id: "transfers", label: "Transferencias", icon: ArrowLeftRight },
] as const;
