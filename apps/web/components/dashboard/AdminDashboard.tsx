"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Contrato, DescuentoDetalle, Transferencia, User } from "@/lib/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/badge";
import { clientApiFetch } from "@/lib/client-api";
import { ADMIN_SECTIONS, AdminSection } from "./admin/sections";
import { cn } from "@/lib/utils";

type UserOption = Pick<User, "id" | "nombre" | "apellido" | "email" | "rol">;

interface AdminDashboardProps {
  contratos: Contrato[];
  transferencias: Transferencia[];
  descuentos: DescuentoDetalle[];
  activeSection: AdminSection;
}

interface ContractEditorState {
  montoMensual: string;
  comisionMensual: string;
  diaVencimiento: string;
  fechaInicio: string;
  fechaFin: string;
  ajusteFrecuenciaMeses: string;
}

interface AjusteState {
  metodo: "ICL" | "IPC";
  montoBase: string;
  meses: string;
  tasaMensual: string;
  indices: string;
  resultado?: number;
  detalle?: string;
  loading?: boolean;
}

const formatCurrency = (value: string | number) => {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "-";
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" });
};

const comparePeriod = (mesA: string, mesB: string) => {
  const [yearA, monthA] = mesA.split("-").map(Number);
  const [yearB, monthB] = mesB.split("-").map(Number);
  return yearA === yearB ? monthA - monthB : yearA - yearB;
};

export const AdminDashboard = ({
  contratos,
  transferencias,
  descuentos,
  activeSection,
}: AdminDashboardProps) => {
  const [contracts, setContracts] = useState<Contrato[]>(contratos);
  const [transfers, setTransfers] = useState<Transferencia[]>(transferencias);
  const [discountsState, setDiscountsState] = useState<DescuentoDetalle[]>(descuentos);
  const [owners, setOwners] = useState<UserOption[]>([]);
  const [tenants, setTenants] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comentariosTransferencia, setComentariosTransferencia] = useState<Record<string, string>>({});

  const [createForm, setCreateForm] = useState({
    propietarioId: "",
    inquilinoId: "",
    direccion: "",
    montoMensual: "",
    comisionMensual: "0",
    diaVencimiento: "10",
    fechaInicio: "",
    fechaFin: "",
    ajusteFrecuenciaMeses: "12",
  });

  const [editorForms, setEditorForms] = useState<Record<string, ContractEditorState>>(() =>
    contratos.reduce<Record<string, ContractEditorState>>((acc, contrato) => {
      acc[contrato.id] = {
        montoMensual: contrato.montoMensual ?? "",
        comisionMensual: contrato.comisionMensual ?? "0",
        diaVencimiento: String(contrato.diaVencimiento ?? 10),
        fechaInicio: contrato.fechaInicio?.slice(0, 10) ?? "",
        fechaFin: contrato.fechaFin?.slice(0, 10) ?? "",
        ajusteFrecuenciaMeses: String(contrato.ajusteFrecuenciaMeses ?? 12),
      };
      return acc;
    }, {})
  );

  const [ajusteForms, setAjusteForms] = useState<Record<string, AjusteState>>(() =>
    contratos.reduce<Record<string, AjusteState>>((acc, contrato) => {
      acc[contrato.id] = {
        metodo: "ICL",
        montoBase: contrato.montoMensual ?? "0",
        meses: String(contrato.ajusteFrecuenciaMeses ?? 12),
        tasaMensual: "0.02",
        indices: "",
      };
      return acc;
    }, {})
  );


  useEffect(() => {
    setEditorForms((prev) => {
      const next: Record<string, ContractEditorState> = {};
      contracts.forEach((contrato) => {
        next[contrato.id] = prev[contrato.id] ?? {
          montoMensual: contrato.montoMensual ?? "",
          comisionMensual: contrato.comisionMensual ?? "0",
          diaVencimiento: String(contrato.diaVencimiento ?? 10),
          fechaInicio: contrato.fechaInicio?.slice(0, 10) ?? "",
          fechaFin: contrato.fechaFin?.slice(0, 10) ?? "",
          ajusteFrecuenciaMeses: String(contrato.ajusteFrecuenciaMeses ?? 12),
        };
      });
      return next;
    });

    setAjusteForms((prev) => {
      const next: Record<string, AjusteState> = {};
      contracts.forEach((contrato) => {
        next[contrato.id] = prev[contrato.id] ?? {
          metodo: "ICL",
          montoBase: contrato.montoMensual ?? "0",
          meses: String(contrato.ajusteFrecuenciaMeses ?? 12),
          tasaMensual: "0.02",
          indices: "",
        };
      });
      return next;
    });
  }, [contracts]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const [ownersRes, tenantsRes] = await Promise.all([
          clientApiFetch<UserOption[]>("/api/usuarios?rol=PROPIETARIO"),
          clientApiFetch<UserOption[]>("/api/usuarios?rol=INQUILINO"),
        ]);
        setOwners(ownersRes);
        setTenants(tenantsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [activeSection]);

  const refreshContracts = async () => {
    const refreshed = await clientApiFetch<Contrato[]>("/api/contratos");
    setContracts(refreshed);
  };

  const handleCreateContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await clientApiFetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propietarioId: createForm.propietarioId,
          inquilinoId: createForm.inquilinoId,
          direccion: createForm.direccion,
          montoMensual: Number(createForm.montoMensual),
          comisionMensual: Number(createForm.comisionMensual || 0),
          diaVencimiento: Number(createForm.diaVencimiento),
          fechaInicio: createForm.fechaInicio,
          fechaFin: createForm.fechaFin,
          ajusteFrecuenciaMeses: Number(createForm.ajusteFrecuenciaMeses || 12),
          estado: "ACTIVO",
        }),
      });
      setMessage("Contrato creado correctamente");
      setCreateForm({
        propietarioId: "",
        inquilinoId: "",
        direccion: "",
        montoMensual: "",
        comisionMensual: "0",
        diaVencimiento: "10",
        fechaInicio: "",
        fechaFin: "",
        ajusteFrecuenciaMeses: "12",
      });
      await refreshContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el contrato");
    }
  };


  const handleUpdateContract = async (contratoId: string) => {
    const form = editorForms[contratoId];
    if (!form) return;
    setError(null);
    setMessage(null);
    try {
      const updated = await clientApiFetch<Contrato>(`/api/contratos/${contratoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoMensual: Number(form.montoMensual),
          comisionMensual: Number(form.comisionMensual || 0),
          diaVencimiento: Number(form.diaVencimiento || 1),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          ajusteFrecuenciaMeses: Number(form.ajusteFrecuenciaMeses || 12),
        }),
      });
      setContracts((prev) => prev.map((item) => (item.id === contratoId ? updated : item)));
      setMessage("Contrato actualizado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el contrato");
    }
  };

  const handleCalcularAjuste = async (contratoId: string) => {
    const form = ajusteForms[contratoId];
    if (!form) return;
    setAjusteForms((prev) => ({
      ...prev,
      [contratoId]: { ...form, loading: true, resultado: undefined, detalle: undefined },
    }));
    setError(null);
    try {
      const params = new URLSearchParams({
        metodo: form.metodo,
        montoBase: form.montoBase,
      });
      if (form.meses) params.append("meses", form.meses);
      if (form.tasaMensual) params.append("tasaMensual", form.tasaMensual);
      if (form.indices) params.append("indices", form.indices);
      const result = await clientApiFetch<{ montoAjustado: number; detalle: string }>(
        `/api/ajustes/calcular?${params.toString()}`
      );
      setAjusteForms((prev) => ({
        ...prev,
        [contratoId]: {
          ...form,
          loading: false,
          resultado: result.montoAjustado,
          detalle: result.detalle,
        },
      }));
    } catch (err) {
      setAjusteForms((prev) => ({
        ...prev,
        [contratoId]: { ...form, loading: false, resultado: undefined, detalle: undefined },
      }));
      setError(err instanceof Error ? err.message : "No se pudo calcular el ajuste");
    }
  };

  const handleAplicarAjuste = async (contratoId: string) => {
    const ajuste = ajusteForms[contratoId];
    if (!ajuste || ajuste.resultado === undefined) {
      setError("Calcula el ajuste antes de aplicarlo");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const updated = await clientApiFetch<Contrato>(`/api/contratos/${contratoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoMensual: ajuste.resultado,
        }),
      });
      setContracts((prev) => prev.map((item) => (item.id === contratoId ? updated : item)));
      setEditorForms((prev) => ({
        ...prev,
        [contratoId]: {
          montoMensual: updated.montoMensual ?? "",
          comisionMensual: updated.comisionMensual ?? "0",
          diaVencimiento: String(updated.diaVencimiento ?? 10),
          fechaInicio: updated.fechaInicio?.slice(0, 10) ?? "",
          fechaFin: updated.fechaFin?.slice(0, 10) ?? "",
          ajusteFrecuenciaMeses: String(updated.ajusteFrecuenciaMeses ?? 12),
        },
      }));
      setAjusteForms((prev) => ({
        ...prev,
        [contratoId]: {
          metodo: ajuste.metodo,
          montoBase: updated.montoMensual ?? "0",
          meses: ajuste.meses,
          tasaMensual: ajuste.tasaMensual,
          indices: ajuste.indices,
          resultado: ajuste.resultado,
          detalle: ajuste.detalle,
        },
      }));
      setMessage("Nuevo monto aplicado al contrato");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar el ajuste");
    }
  };

  const handleActualizarDescuento = async (id: string, estado: "APROBADO" | "RECHAZADO") => {
    setError(null);
    setMessage(null);
    try {
      const actualizado = await clientApiFetch<DescuentoDetalle>(`/api/descuentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      setDiscountsState((prev) => prev.map((item) => (item.id === id ? actualizado : item)));
      setMessage("Estado de descuento actualizado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el descuento");
    }
  };

  const handleVerificarTransferencia = async (id: string, aprobar: boolean) => {
    setError(null);
    setMessage(null);
    try {
      await clientApiFetch(`/api/transferencias/${id}/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobar, comentario: comentariosTransferencia[id] ?? "" }),
      });
      setTransfers((prev) => prev.filter((item) => item.id !== id));
      setMessage("Transferencia verificada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar la transferencia");
    }
  };

  const contratosOrdenados = useMemo(
    () => [...contracts].sort((a, b) => a.direccion.localeCompare(b.direccion)),
    [contracts]
  );


  return (
    <div className="flex flex-col md:flex-row">
      <aside
        className={cn(
          "relative z-40 w-full min-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white text-slate-900 shadow-lg",
          "md:fixed md:top-16 md:bottom-0 md:left-0 md:w-72 md:min-h-0 md:border-b-0 md:border-r md:border-slate-200 md:shadow-none"
        )}
      >
        <div className="px-6 py-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Menu</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">Panel de control</h2>
            <p className="mt-2 text-sm text-slate-500">Elegi la seccion que queres administrar.</p>
          </div>
          <nav>
            <ul className="space-y-1.5">
              {ADMIN_SECTIONS.map((section) => {
                const isActive = section.id === activeSection;
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <Link
                      href={`/dashboard/admin/${section.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-slate-100 text-slate-900 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border text-sm",
                          isActive
                            ? "border-slate-300 bg-white text-slate-900"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        )}
                        aria-hidden
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span>{section.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 space-y-12 px-4 py-10 md:ml-72 md:px-8 md:py-12">
        {(message || error) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"
            }`}
          >
            {message ?? error}
          </div>
        )}

        {activeSection === "overview" && (
          <section
            id="overview"
            className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-12 text-white shadow-xl"
          >
            <div className="max-w-4xl space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Resumen</p>
                <h1 className="text-4xl font-bold mb-4">Gestion ordenada y sin sobresaltos</h1>
                <p className="text-base text-slate-300 max-w-2xl">
                  Asigna contratos con todos los datos clave, actualiza montos cuando corresponde y controla los pagos
                  desde un unico lugar.
                </p>
              </div>

              {/* Cards de métricas */}
              <div className="grid gap-6 sm:grid-cols-3 mt-10">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <dt className="text-xs uppercase tracking-wider text-slate-300">Contratos activos</dt>
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  </div>
                  <dd className="text-3xl font-bold">{contracts.length}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <dt className="text-xs uppercase tracking-wider text-slate-300">Descuentos pendientes</dt>
                    <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                  </div>
                  <dd className="text-3xl font-bold">{discountsState.filter((d) => d.estado === "PENDIENTE").length}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <dt className="text-xs uppercase tracking-wider text-slate-300">Transferencias a revisar</dt>
                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                  </div>
                  <dd className="text-3xl font-bold">{transfers.length}</dd>
                </div>
              </div>
            </div>
          </section>
        )}
        {activeSection === "assign" && (
          <section id="assign" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Asignar un nuevo contrato</h2>
            <p className="text-sm text-slate-600">Define monto, comision, fechas y ajustes en pocos pasos.</p>
          </div>
          <Card className="rounded-3xl border-slate-200 p-8 shadow-md">
            <form onSubmit={handleCreateContract} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="propietario">Propietario</Label>
                <Select
                  id="propietario"
                  value={createForm.propietarioId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, propietarioId: event.target.value }))}
                  disabled={loadingUsers}
                >
                  <option value="">Selecciona propietario</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.nombre} {owner.apellido} ({owner.email})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="inquilino">Inquilino</Label>
                <Select
                  id="inquilino"
                  value={createForm.inquilinoId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, inquilinoId: event.target.value }))}
                  disabled={loadingUsers}
                >
                  <option value="">Selecciona inquilino</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.nombre} {tenant.apellido} ({tenant.email})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="direccion">Direccion</Label>
                <Input
                  id="direccion"
                  value={createForm.direccion}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, direccion: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="monto">Monto mensual</Label>
                <Input
                  id="monto"
                  type="number"
                  min={0}
                  value={createForm.montoMensual}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, montoMensual: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="comision">Comision</Label>
                <Input
                  id="comision"
                  type="number"
                  min={0}
                  value={createForm.comisionMensual}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, comisionMensual: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dia">Dia de vencimiento</Label>
                <Input
                  id="dia"
                  type="number"
                  min={1}
                  max={31}
                  value={createForm.diaVencimiento}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, diaVencimiento: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ajuste">Frecuencia de ajuste (meses)</Label>
                <Input
                  id="ajuste"
                  type="number"
                  min={1}
                  max={60}
                  value={createForm.ajusteFrecuenciaMeses}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, ajusteFrecuenciaMeses: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inicio">Fecha inicio</Label>
                <Input
                  id="inicio"
                  type="date"
                  value={createForm.fechaInicio}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, fechaInicio: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fin">Fecha fin</Label>
                <Input
                  id="fin"
                  type="date"
                  value={createForm.fechaFin}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, fechaFin: event.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={!createForm.propietarioId || !createForm.inquilinoId || loadingUsers}>
                  Crear contrato
                </Button>
              </div>
            </form>
          </Card>
        </section>
        )}
        {activeSection === "contracts" && (
          <section id="contracts" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Contratos activos</h2>
            <p className="text-sm text-slate-600">Gestiona montos, comisiones y ajustes desde aqui.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {contratosOrdenados.map((contrato) => {
              const editor = editorForms[contrato.id] ?? {
                montoMensual: contrato.montoMensual ?? "",
                comisionMensual: contrato.comisionMensual ?? "0",
                diaVencimiento: String(contrato.diaVencimiento ?? 10),
                fechaInicio: contrato.fechaInicio?.slice(0, 10) ?? "",
                fechaFin: contrato.fechaFin?.slice(0, 10) ?? "",
                ajusteFrecuenciaMeses: String(contrato.ajusteFrecuenciaMeses ?? 12),
              };
              const ajuste = ajusteForms[contrato.id] ?? {
                metodo: "ICL",
                montoBase: contrato.montoMensual ?? "0",
                meses: String(contrato.ajusteFrecuenciaMeses ?? 12),
                tasaMensual: "0.02",
                indices: "",
              };

              const pagosPendientes = contrato.pagos?.filter((pago) => pago.estado === "PENDIENTE").length ?? 0;
              const ultimoPago = contrato.pagos?.slice().sort((a, b) => comparePeriod(b.mes, a.mes))[0];

              return (
                <Card key={contrato.id} className="space-y-5 rounded-3xl border-slate-200 p-6 shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg text-slate-900">{contrato.direccion}</CardTitle>
                      <CardDescription className="text-slate-500">
                        Inquilino: {contrato.inquilino?.nombre} {contrato.inquilino?.apellido}
                      </CardDescription>
                      <p className="mt-2 text-xs text-slate-400">
                        Ultimo pago: {ultimoPago ? `${ultimoPago.mes} (${ultimoPago.estado})` : "Sin registrar"}
                      </p>
                    </div>
                    <StatusBadge status={contrato.estado} />
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Monto mensual</p>
                      <p className="font-medium text-slate-900">{formatCurrency(contrato.montoMensual)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Comision</p>
                      <p className="font-medium text-slate-900">{formatCurrency(contrato.comisionMensual)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Vencimiento</p>
                      <p>Dia {contrato.diaVencimiento}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Pagos pendientes</p>
                      <p>{pagosPendientes}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Inicio</p>
                      <p>{formatDate(contrato.fechaInicio)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Fin</p>
                      <p>{formatDate(contrato.fechaFin)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-900">Editar datos principales</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Monto mensual</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editor.montoMensual}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, montoMensual: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Comision</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editor.comisionMensual}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, comisionMensual: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Dia de vencimiento</Label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={editor.diaVencimiento}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, diaVencimiento: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Frecuencia de ajuste (meses)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          value={editor.ajusteFrecuenciaMeses}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, ajusteFrecuenciaMeses: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Fecha inicio</Label>
                        <Input
                          type="date"
                          value={editor.fechaInicio}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, fechaInicio: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Fecha fin</Label>
                        <Input
                          type="date"
                          value={editor.fechaFin}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, fechaFin: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleUpdateContract(contrato.id)}>
                      Guardar cambios
                    </Button>
                  </div>


                  <div className="space-y-4 rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-900">Calcular y aplicar ajuste</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Metodo</Label>
                        <Select
                          value={ajuste.metodo}
                          onChange={(event) =>
                            setAjusteForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...ajuste, metodo: event.target.value as AjusteState["metodo"] },
                            }))
                          }
                        >
                          <option value="ICL">ICL</option>
                          <option value="IPC">IPC</option>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Monto base</Label>
                        <Input
                          type="number"
                          min={0}
                          value={ajuste.montoBase}
                          onChange={(event) =>
                            setAjusteForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...ajuste, montoBase: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Meses</Label>
                        <Input
                          type="number"
                          min={1}
                          value={ajuste.meses}
                          onChange={(event) =>
                            setAjusteForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...ajuste, meses: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tasa mensual (decimal)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={ajuste.tasaMensual}
                          onChange={(event) =>
                            setAjusteForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...ajuste, tasaMensual: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label>Indices (opcional, separados por coma)</Label>
                        <Input
                          value={ajuste.indices}
                          onChange={(event) =>
                            setAjusteForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...ajuste, indices: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => handleCalcularAjuste(contrato.id)}
                        disabled={ajuste.loading}
                      >
                        {ajuste.loading ? "Calculando..." : "Calcular ajuste"}
                      </Button>
                      {ajuste.resultado !== undefined && (
                        <Button onClick={() => handleAplicarAjuste(contrato.id)}>
                          Aplicar {formatCurrency(ajuste.resultado)}
                        </Button>
                      )}
                    </div>
                    {ajuste.detalle && <p className="text-xs text-slate-500">{ajuste.detalle}</p>}
                  </div>
                </Card>
              );
            })}
          </div>
          {contratosOrdenados.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Todavia no hay contratos cargados.
            </p>
          )}
        </section>
        )}
        {activeSection === "discounts" && (
          <section id="discounts" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Solicitudes de descuento</h2>
            <p className="text-sm text-slate-600">Aprueba o rechaza los casos enviados por inquilinos.</p>
          </div>
          <div className="space-y-4">
            {discountsState.map((descuento) => (
              <Card key={descuento.id} className="space-y-4 rounded-3xl border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base">{formatCurrency(descuento.monto)}</CardTitle>
                    <CardDescription>
                      {descuento.motivo} - {descuento.contrato.direccion} - {descuento.contrato.inquilino?.nombre} {descuento.contrato.inquilino?.apellido}
                    </CardDescription>
                    <p className="text-xs text-slate-400">Solicitado el {formatDate(descuento.createdAt)}</p>
                  </div>
                  <StatusBadge status={descuento.estado} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleActualizarDescuento(descuento.id, "APROBADO")}
                    disabled={descuento.estado === "APROBADO"}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActualizarDescuento(descuento.id, "RECHAZADO")}
                    disabled={descuento.estado === "RECHAZADO"}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
            {discountsState.length === 0 && (
              <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No hay solicitudes de descuento por ahora.
              </p>
            )}
          </div>
        </section>
        )}
        {activeSection === "transfers" && (
          <section id="transfers" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Transferencias pendientes</h2>
            <p className="text-sm text-slate-600">Verifica comprobantes y deja comentarios si es necesario.</p>
          </div>
          <div className="space-y-4">
            {transfers.map((item) => (
              <Card key={item.id} className="space-y-4 rounded-3xl border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{item.pago.contrato.direccion}</CardTitle>
                  <span className="text-sm text-slate-500">Mes {item.pago.mes}</span>
                </div>
                <CardDescription>
                  Inquilino: {item.pago.contrato.inquilino?.nombre} {item.pago.contrato.inquilino?.apellido} - {formatCurrency(item.pago.monto)}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    className="text-sm font-medium text-primary hover:underline"
                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/transferencias/${item.id}/comprobante`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver comprobante
                  </a>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString("es-AR")}
                  </span>
                </div>
                <Textarea
                  placeholder="Comentario opcional"
                  value={comentariosTransferencia[item.id] ?? ""}
                  onChange={(event) =>
                    setComentariosTransferencia((prev) => ({ ...prev, [item.id]: event.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleVerificarTransferencia(item.id, true)}>Aprobar</Button>
                  <Button variant="outline" onClick={() => handleVerificarTransferencia(item.id, false)}>
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
            {transfers.length === 0 && (
              <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No hay transferencias pendientes.
              </p>
            )}
          </div>
        </section>
        )}
      </main>
    </div>
  );
};
