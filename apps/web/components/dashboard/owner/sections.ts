import { Home, FileText, CreditCard, Settings } from "lucide-react";
import { UserRole } from "@admin-inmo/shared";

export type OwnerSection = "overview" | "contratos" | "transferencias";

export interface OwnerSectionConfig {
  id: OwnerSection;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

export const OWNER_SECTIONS: OwnerSectionConfig[] = [
  {
    id: "overview",
    label: "Resumen",
    icon: Home,
    description: "Vista general de tu cartera de propiedades",
  },
  {
    id: "contratos",
    label: "Contratos",
    icon: FileText,
    description: "Gestiona tus contratos de alquiler",
  },
  {
    id: "transferencias",
    label: "Transferencias",
    icon: CreditCard,
    description: "Revisa y aprueba tus transferencias",
  },
];

export const getOwnerSectionsForRole = (role: UserRole): OwnerSectionConfig[] => {
  switch (role) {
    case UserRole.PROPIETARIO:
      return OWNER_SECTIONS;
    default:
      return [];
  }
};
