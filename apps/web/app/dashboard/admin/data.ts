import { serverApiFetch } from "@/lib/server-api";
import { Contrato, DescuentoDetalle, Transferencia } from "@/lib/types";

export async function fetchAdminDashboardData() {
  const [contratos, descuentos, transferencias] = await Promise.all([
    serverApiFetch<Contrato[]>("/api/contratos"),
    serverApiFetch<DescuentoDetalle[]>("/api/descuentos"),
    serverApiFetch<Transferencia[]>("/api/pagos/transferencias-inmobiliaria"), // Changed to new endpoint
  ]);

  return { contratos, descuentos, transferencias };
}
