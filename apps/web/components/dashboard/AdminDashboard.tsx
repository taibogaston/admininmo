"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, Copy } from "lucide-react";
import { Contrato, DescuentoDetalle, Transferencia, User } from "@/lib/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/badge";
import { clientApiFetch } from "@/lib/client-api";
import { ADMIN_SECTIONS, AdminSection, getAdminSectionsForRole } from "./admin/sections";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { UserRole } from "@admin-inmo/shared";
import { ConfiguracionPagosForm } from "./admin/ConfiguracionPagosForm";
import { TransferenciasPendientesList } from "./admin/TransferenciasPendientesList";
import { TransferenciasInmobiliariaList } from "./admin/TransferenciasInmobiliariaList";

type UserOption = Pick<User, "id" | "nombre" | "apellido" | "email" | "rol" | "dni">;

interface AdminDashboardProps {
  contratos: Contrato[];
  transferencias: Transferencia[];
  descuentos: DescuentoDetalle[];
  activeSection: AdminSection;
  userRole: UserRole;
}

interface ContractEditorState {
  montoTotalAlquiler: string;
  porcentajeComisionInmobiliaria: string;
  diaVencimiento: string;
  fechaInicio: string;
  fechaFin: string;
  ajusteFrecuenciaMeses: string;
  fechaUltimoAjuste: string;
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

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonthsToDate = (date: Date, months: number) => {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
};

const sortUserOptions = (users: UserOption[]) =>
  [...users].sort((a, b) => {
    const nameCompare = a.nombre.localeCompare(b.nombre, "es");
    if (nameCompare !== 0) return nameCompare;
    const lastNameCompare = a.apellido.localeCompare(b.apellido, "es");
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.email.localeCompare(b.email, "es");
  });

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const AdminDashboard = ({
  contratos,
  transferencias,
  descuentos,
  activeSection,
  userRole,
}: AdminDashboardProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [contracts, setContracts] = useState<Contrato[]>(contratos);
  const [transfers, setTransfers] = useState<Transferencia[]>(transferencias);
  const [discountsState, setDiscountsState] = useState<DescuentoDetalle[]>(descuentos);
  const [owners, setOwners] = useState<UserOption[]>([]);
  const [tenants, setTenants] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comentariosTransferencia, setComentariosTransferencia] = useState<Record<string, string>>({});
  const [createUserForm, setCreateUserForm] = useState({
    dni: "",
    email: "",
    nombre: "",
    apellido: "",
    rol: UserRole.INQUILINO,
  });
  const [createUserSubmitting, setCreateUserSubmitting] = useState(false);
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{ email: string; password: string; role: UserRole } | null>(null);

  const [createForm, setCreateForm] = useState({
    propietarioId: "",
    inquilinoId: "",
    direccion: "",
    montoTotalAlquiler: "",
    porcentajeComisionInmobiliaria: "0",
    diaVencimiento: "10",
    fechaInicio: "",
    fechaFin: "",
    ajusteFrecuenciaMeses: "12",
    fechaUltimoAjuste: "",
  });

  const [editorForms, setEditorForms] = useState<Record<string, ContractEditorState>>(() =>
    contratos.reduce<Record<string, ContractEditorState>>((acc, contrato) => {
      acc[contrato.id] = {
        montoTotalAlquiler: contrato.montoTotalAlquiler ?? "",
        porcentajeComisionInmobiliaria: contrato.porcentajeComisionInmobiliaria ?? "0",
        diaVencimiento: String(contrato.diaVencimiento ?? 10),
        fechaInicio: contrato.fechaInicio?.slice(0, 10) ?? "",
        fechaFin: contrato.fechaFin?.slice(0, 10) ?? "",
        ajusteFrecuenciaMeses: String(contrato.ajusteFrecuenciaMeses ?? 12),
        fechaUltimoAjuste: contrato.fechaUltimoAjuste?.slice(0, 10) ?? "",
      };
      return acc;
    }, {})
  );

  const [ajusteForms, setAjusteForms] = useState<Record<string, AjusteState>>(() =>
    contratos.reduce<Record<string, AjusteState>>((acc, contrato) => {
      acc[contrato.id] = {
        metodo: "ICL",
        montoBase: contrato.montoTotalAlquiler ?? "0",
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
        const previous = prev[contrato.id];
        next[contrato.id] = {
          montoTotalAlquiler: previous?.montoTotalAlquiler ?? contrato.montoTotalAlquiler ?? "",
          porcentajeComisionInmobiliaria: previous?.porcentajeComisionInmobiliaria ?? contrato.porcentajeComisionInmobiliaria ?? "0",
          diaVencimiento: previous?.diaVencimiento ?? String(contrato.diaVencimiento ?? 10),
          fechaInicio: previous?.fechaInicio ?? contrato.fechaInicio?.slice(0, 10) ?? "",
          fechaFin: previous?.fechaFin ?? contrato.fechaFin?.slice(0, 10) ?? "",
          ajusteFrecuenciaMeses:
            previous?.ajusteFrecuenciaMeses ?? String(contrato.ajusteFrecuenciaMeses ?? 12),
          fechaUltimoAjuste:
            previous?.fechaUltimoAjuste ?? contrato.fechaUltimoAjuste?.slice(0, 10) ?? "",
        };
      });
      return next;
    });

    setAjusteForms((prev) => {
      const next: Record<string, AjusteState> = {};
      contracts.forEach((contrato) => {
        next[contrato.id] = prev[contrato.id] ?? {
          metodo: "ICL",
          montoBase: contrato.montoTotalAlquiler ?? "0",
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
      try {
        const [ownersRes, tenantsRes] = await Promise.all([
          clientApiFetch<UserOption[]>("/api/usuarios?rol=PROPIETARIO"),
          clientApiFetch<UserOption[]>("/api/usuarios?rol=INQUILINO"),
        ]);
        setOwners(sortUserOptions(ownersRes));
        setTenants(sortUserOptions(tenantsRes));
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los usuarios";
        toast.error(message);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeSection]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    document.body.style.overflow = originalOverflow;
  }, [mobileNavOpen]);

  const userSections = useMemo(() => getAdminSectionsForRole(userRole), [userRole]);
  
  const activeSectionConfig = useMemo(
    () => userSections.find((section) => section.id === activeSection) ?? userSections[0],
    [activeSection, userSections]
  );

  const NavigationItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-1.5">
      {userSections.map((section) => {
        const isActive = section.id === activeSection;
        const Icon = section.icon;
        return (
          <li key={section.id}>
            <Link
              href={`/dashboard/admin/${section.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                onNavigate?.();
              }}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors",
                  isActive
                    ? "border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
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
  );

  const SidebarContent = ({
    onNavigate,
    hideHeading = false,
  }: {
    onNavigate?: () => void;
    hideHeading?: boolean;
  }) => (
    <div className="flex h-full flex-col px-6 py-8">
      {!hideHeading && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Menu</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Panel de control</h2>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto">
        <NavigationItems onNavigate={onNavigate} />
      </nav>
    </div>
  );

  const refreshContracts = async () => {
    const refreshed = await clientApiFetch<Contrato[]>("/api/contratos");
    setContracts(refreshed);
  };

  const handleCopyTemporaryPassword = async () => {
    if (!lastCreatedCredentials?.password) return;
    try {
      await navigator.clipboard.writeText(lastCreatedCredentials.password);
      toast.success("Contrasena temporal copiada");
    } catch {
      toast.error("No pudimos copiar la contrasena temporal");
    }
  };

  const handleClearTemporaryCredentials = () => {
    setLastCreatedCredentials(null);
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateUserSubmitting(true);
    try {
      const payload = {
        dni: createUserForm.dni.trim(),
        email: createUserForm.email.trim(),
        nombre: createUserForm.nombre.trim(),
        apellido: createUserForm.apellido.trim(),
        rol: createUserForm.rol,
      };

      const response = await clientApiFetch<{ user: User; temporaryPassword: string | null }>("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const createdUser = response.user;
      const option: UserOption = {
        id: createdUser.id,
        nombre: createdUser.nombre,
        apellido: createdUser.apellido,
        email: createdUser.email,
        rol: createdUser.rol,
        dni: createdUser.dni ?? null,
      };

      if (createdUser.rol === UserRole.PROPIETARIO) {
        setOwners((prev) => sortUserOptions([...prev, option]));
      } else if (createdUser.rol === UserRole.INQUILINO) {
        setTenants((prev) => sortUserOptions([...prev, option]));
      }

      setCreateUserForm({
        dni: "",
        email: "",
        nombre: "",
        apellido: "",
        rol: UserRole.INQUILINO,
      });

      if (response.temporaryPassword) {
        toast.success(`Usuario creado. Contraseña temporal: ${response.temporaryPassword}`);
      } else {
        toast.success("Usuario creado correctamente");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el usuario";
      toast.error(message);
    } finally {
      setCreateUserSubmitting(false);
    }
  };

  const handleCreateContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.fechaUltimoAjuste) {
      toast.error("Indica la fecha del ultimo ajuste");
      return;
    }
    try {
      await clientApiFetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propietarioId: createForm.propietarioId,
          inquilinoId: createForm.inquilinoId,
          direccion: createForm.direccion,
          montoTotalAlquiler: Number(createForm.montoTotalAlquiler),
          porcentajeComisionInmobiliaria: Number(createForm.porcentajeComisionInmobiliaria || 0),
          diaVencimiento: Number(createForm.diaVencimiento),
          fechaInicio: createForm.fechaInicio,
          fechaFin: createForm.fechaFin,
          fechaUltimoAjuste: createForm.fechaUltimoAjuste,
          ajusteFrecuenciaMeses: Number(createForm.ajusteFrecuenciaMeses || 12),
          estado: "ACTIVO",
        }),
      });
      toast.success("Contrato creado correctamente");
      setCreateForm({
        propietarioId: "",
        inquilinoId: "",
        direccion: "",
        montoTotalAlquiler: "",
        porcentajeComisionInmobiliaria: "0",
        diaVencimiento: "10",
        fechaInicio: "",
        fechaFin: "",
        ajusteFrecuenciaMeses: "12",
        fechaUltimoAjuste: "",
      });
      await refreshContracts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el contrato";
      toast.error(message);
    }
  };


  const handleUpdateContract = async (contratoId: string) => {
    const form = editorForms[contratoId];
    if (!form) return;
    try {
      const updated = await clientApiFetch<Contrato>(`/api/contratos/${contratoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoTotalAlquiler: Number(form.montoTotalAlquiler),
          porcentajeComisionInmobiliaria: Number(form.porcentajeComisionInmobiliaria || 0),
          diaVencimiento: Number(form.diaVencimiento || 1),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin,
          fechaUltimoAjuste: form.fechaUltimoAjuste,
          ajusteFrecuenciaMeses: Number(form.ajusteFrecuenciaMeses || 12),
        }),
      });
      setContracts((prev) => prev.map((item) => (item.id === contratoId ? updated : item)));
      toast.success("Contrato actualizado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el contrato";
      toast.error(message);
    }
  };

  const handleCalcularAjuste = async (contratoId: string) => {
    const form = ajusteForms[contratoId];
    if (!form) return;
    setAjusteForms((prev) => ({
      ...prev,
      [contratoId]: { ...form, loading: true, resultado: undefined, detalle: undefined },
    }));
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
      const message = err instanceof Error ? err.message : "No se pudo calcular el ajuste";
      toast.error(message);
    }
  };

  const handleAplicarAjuste = async (contratoId: string) => {
    const ajuste = ajusteForms[contratoId];
    if (!ajuste || ajuste.resultado === undefined) {
      toast.error("Calcula el ajuste antes de aplicarlo");
      return;
    }

    const contrato = contracts.find((item) => item.id === contratoId);
    const ultimoAjuste = parseDate(contrato?.fechaUltimoAjuste);
    if (ultimoAjuste) {
      const mesesAjuste =
        (contrato?.ajusteFrecuenciaMeses ?? Number(ajuste.meses || 0)) || 1;
      const proximoAjuste = addMonthsToDate(ultimoAjuste, mesesAjuste);
      if (proximoAjuste > new Date()) {
        toast.error(`Podras aplicar el ajuste a partir del ${formatDate(proximoAjuste.toISOString())}`);
        return;
      }
    }

    try {
      const updated = await clientApiFetch<Contrato>(`/api/contratos/${contratoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoTotalAlquiler: ajuste.resultado,
          fechaUltimoAjuste: new Date().toISOString(),
        }),
      });
      setContracts((prev) => prev.map((item) => (item.id === contratoId ? updated : item)));
      setEditorForms((prev) => ({
        ...prev,
        [contratoId]: {
          montoTotalAlquiler: updated.montoTotalAlquiler ?? "",
          porcentajeComisionInmobiliaria: updated.porcentajeComisionInmobiliaria ?? "0",
          diaVencimiento: String(updated.diaVencimiento ?? 10),
          fechaInicio: updated.fechaInicio?.slice(0, 10) ?? "",
          fechaFin: updated.fechaFin?.slice(0, 10) ?? "",
          ajusteFrecuenciaMeses: String(updated.ajusteFrecuenciaMeses ?? 12),
          fechaUltimoAjuste: updated.fechaUltimoAjuste?.slice(0, 10) ?? toIsoDate(new Date()),
        },
      }));
      setAjusteForms((prev) => ({
        ...prev,
        [contratoId]: {
          metodo: ajuste.metodo,
          montoBase: updated.montoTotalAlquiler ?? "0",
          meses: ajuste.meses,
          tasaMensual: ajuste.tasaMensual,
          indices: ajuste.indices,
          resultado: undefined,
          detalle: undefined,
        },
      }));
      toast.success("Nuevo monto aplicado al contrato");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo aplicar el ajuste";
      toast.error(message);
    }
  };

  const handleActualizarDescuento = async (id: string, estado: "APROBADO" | "RECHAZADO") => {
    try {
      const actualizado = await clientApiFetch<DescuentoDetalle>(`/api/descuentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      setDiscountsState((prev) => prev.map((item) => (item.id === id ? actualizado : item)));
      toast.success("Estado de descuento actualizado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el descuento";
      toast.error(message);
    }
  };

  const handleVerificarTransferencia = async (id: string, aprobar: boolean) => {
    try {
      await clientApiFetch(`/api/transferencias/${id}/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobar, comentario: comentariosTransferencia[id] ?? "" }),
      });
      setTransfers((prev) => prev.filter((item) => item.id !== id));
      toast.success("Transferencia verificada");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo verificar la transferencia";
      toast.error(message);
    }
  };

  const contratosOrdenados = useMemo(
    () => [...contracts].sort((a, b) => a.direccion.localeCompare(b.direccion)),
    [contracts]
  );


  return (
    <>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <aside className="relative ml-auto flex h-full w-4/5 max-w-xs flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full p-0"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Cerrar menu de navegacion"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} hideHeading />
            </div>
          </aside>
        </div>
      )}

      <div className="flex w-full flex-col md:flex-row">
        <aside
          className={cn(
            "relative hidden min-h-[calc(100vh-4rem)] w-72 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-lg transition-colors dark:border-slate-800 dark:bg-slate-950 md:flex",
            "md:fixed md:top-16 md:bottom-0 md:left-0 md:shadow-none"
          )}
        >
          <SidebarContent />
        </aside>

        <main className="flex-1 w-full space-y-12 px-4 pb-16 pt-6 md:ml-72 md:px-10 md:pb-20 md:pt-10">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-500">Seccion actual</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeSectionConfig.label}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileNavOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Navegar
            </Button>
          </div>

        {activeSection === "overview" && (
          <section
            id="overview"
            className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-12 text-white shadow-xl"
          >
            <div className="max-w-4xl space-y-6">
              <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2 dark:text-slate-500">Resumen</p>
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
        {activeSection === "users" && (
          <section id="users" className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Usuarios de la inmobiliaria</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Crealos, comparti la contrasena temporal por un canal seguro y avisa que debe actualizarla al ingresar.</p>
            </div>
            <Card className="rounded-3xl border-slate-200 p-8 shadow-md dark:border-slate-800 dark:bg-slate-900">
              <form onSubmit={handleCreateUser} className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="user-dni">DNI</Label>
                  <Input
                    id="user-dni"
                    value={createUserForm.dni}
                    onChange={(event) => setCreateUserForm((prev) => ({ ...prev, dni: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={createUserForm.email}
                    onChange={(event) => setCreateUserForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-nombre">Nombre</Label>
                  <Input
                    id="user-nombre"
                    value={createUserForm.nombre}
                    onChange={(event) => setCreateUserForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-apellido">Apellido</Label>
                  <Input
                    id="user-apellido"
                    value={createUserForm.apellido}
                    onChange={(event) => setCreateUserForm((prev) => ({ ...prev, apellido: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="user-rol">Rol</Label>
                  <Select
                    id="user-rol"
                    value={createUserForm.rol}
                    onChange={(event) => setCreateUserForm((prev) => ({ ...prev, rol: event.target.value as UserRole }))}
                  >
                    <option value={UserRole.INQUILINO}>Inquilino</option>
                    <option value={UserRole.PROPIETARIO}>Propietario</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createUserSubmitting}>
                    {createUserSubmitting ? "Creando usuario..." : "Crear usuario"}
                  </Button>
                </div>
              </form>
            </Card>
            {lastCreatedCredentials?.password && (
              <Card className="rounded-3xl border border-dashed border-amber-400/70 bg-amber-50 p-6 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10">
                <CardTitle className="text-base text-amber-900 dark:text-amber-200">Credenciales temporales</CardTitle>
                <CardDescription className="text-sm text-amber-800 dark:text-amber-300">Se muestran una sola vez. Copialas y compartilas solo por un canal seguro.</CardDescription>
                <p className="mt-3 text-sm text-amber-900 dark:text-amber-100">{lastCreatedCredentials.email} - {lastCreatedCredentials.role.toLowerCase()}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/70 bg-white/80 px-4 py-3 text-sm font-mono dark:border-amber-400/40 dark:bg-amber-900/20">
                  <span className="flex-1 text-amber-900 dark:text-amber-100">{lastCreatedCredentials.password}</span>
                  <Button type="button" variant="outline" size="sm" onClick={handleCopyTemporaryPassword} className="inline-flex items-center gap-2">
                    <Copy className="h-4 w-4" /> Copiar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearTemporaryCredentials}>Ocultar</Button>
                </div>
                <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">El sistema obliga a cambiarla en el primer ingreso.</p>
              </Card>
            )}
          </section>
        )}
        {activeSection === "assign" && (
          <section id="assign" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Asignar un nuevo contrato</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Define monto, comision, fechas y ajustes en pocos pasos.</p>
          </div>
          <Card className="rounded-3xl border-slate-200 p-8 shadow-md dark:border-slate-800 dark:bg-slate-900">
            <form onSubmit={handleCreateContract} className="mt-6 space-y-6">
              {/* Sección 1: Propietario e Inquilino */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="propietario">Propietario</Label>
                  <Select
                    id="propietario"
                    value={createForm.propietarioId}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, propietarioId: event.target.value }))}
                    disabled={loadingUsers}
                    required
                  >
                    <option value="">Selecciona propietario</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {`${owner.nombre} ${owner.apellido} (${owner.email}${owner.dni ? ` - ${owner.dni}` : ""})`}
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
                    required
                  >
                    <option value="">Selecciona inquilino</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {`${tenant.nombre} ${tenant.apellido} (${tenant.email}${tenant.dni ? ` - ${tenant.dni}` : ""})`}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Sección 2: Dirección */}
              <div className="space-y-1">
                <Label htmlFor="direccion">Direccion</Label>
                <Input
                  id="direccion"
                  value={createForm.direccion}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, direccion: event.target.value }))}
                  placeholder="Ej. Av. Siempre Viva 742"
                  required
                />
              </div>

              {/* Sección 3: Monto y Comisión */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="monto">Monto total del alquiler</Label>
                  <Input
                    id="monto"
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.montoTotalAlquiler}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, montoTotalAlquiler: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="comision">Comisión inmobiliaria (%)</Label>
                  <Input
                    id="comision"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={createForm.porcentajeComisionInmobiliaria}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, porcentajeComisionInmobiliaria: event.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Sección 4: Día de vencimiento y Frecuencia de ajuste */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">1 al 31, según el contrato.</p>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ej.: 12 para ajustes anuales.</p>
                </div>
              </div>

              {/* Sección 5: Fechas */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="inicio">Inicio del contrato</Label>
                  <Input
                    id="inicio"
                    type="date"
                    value={createForm.fechaInicio}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        fechaInicio: event.target.value,
                        fechaUltimoAjuste: prev.fechaUltimoAjuste || event.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Desde cuándo corre el contrato.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ultimo-ajuste">Ultimo ajuste aplicado</Label>
                  <Input
                    id="ultimo-ajuste"
                    type="date"
                    value={createForm.fechaUltimoAjuste}
                    min={createForm.fechaInicio || undefined}
                    max={createForm.fechaFin || undefined}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, fechaUltimoAjuste: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Usado para calcular el próximo ajuste. Completa la fecha del último ajuste para estimar el próximo.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fin">Fin del contrato</Label>
                  <Input
                    id="fin"
                    type="date"
                    value={createForm.fechaFin}
                    min={createForm.fechaInicio || undefined}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, fechaFin: event.target.value }))}
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Debe ser posterior al inicio.</p>
                </div>
              </div>

              {/* Información del próximo ajuste */}
              {createForm.fechaUltimoAjuste && createForm.ajusteFrecuenciaMeses && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Próximo ajuste automático estimado:</strong> {formatDate(
                      addMonthsToDate(
                        new Date(createForm.fechaUltimoAjuste),
                        Number(createForm.ajusteFrecuenciaMeses || 0) || 1
                      ).toISOString()
                    )}
                  </p>
                </div>
              )}

              {/* Botón de envío */}
              <div className="flex justify-start">
                <Button
                  type="submit"
                  disabled={
                    !createForm.propietarioId ||
                    !createForm.inquilinoId ||
                    !createForm.fechaUltimoAjuste ||
                    loadingUsers
                  }
                >
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
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Contratos activos</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Gestiona montos, comisiones y ajustes desde aqui.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {contratosOrdenados.map((contrato) => {
              const editor = editorForms[contrato.id] ?? {
                montoTotalAlquiler: contrato.montoTotalAlquiler ?? "",
                porcentajeComisionInmobiliaria: contrato.porcentajeComisionInmobiliaria ?? "0",
                diaVencimiento: String(contrato.diaVencimiento ?? 10),
                fechaInicio: contrato.fechaInicio?.slice(0, 10) ?? "",
                fechaFin: contrato.fechaFin?.slice(0, 10) ?? "",
                ajusteFrecuenciaMeses: String(contrato.ajusteFrecuenciaMeses ?? 12),
                fechaUltimoAjuste: contrato.fechaUltimoAjuste?.slice(0, 10) ?? "",
              };
              const ajuste = ajusteForms[contrato.id] ?? {
                metodo: "ICL",
                montoBase: contrato.montoTotalAlquiler ?? "0",
                meses: String(contrato.ajusteFrecuenciaMeses ?? 12),
                tasaMensual: "0.02",
                indices: "",
              };

              const ultimoAjusteDate = parseDate(contrato.fechaUltimoAjuste);
              const proximoAjusteDate = ultimoAjusteDate
                ? addMonthsToDate(ultimoAjusteDate, contrato.ajusteFrecuenciaMeses)
                : null;
              const ajusteDisponible = !proximoAjusteDate || proximoAjusteDate <= new Date();

              const pagosPendientes = contrato.pagos?.filter((pago) => pago.estado === "PENDIENTE").length ?? 0;
              const ultimoPago = contrato.pagos?.slice().sort((a, b) => comparePeriod(b.mes, a.mes))[0];

              return (
                <Card
                  key={contrato.id}
                  className="space-y-5 rounded-3xl border-slate-200 p-6 shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">{contrato.direccion}</CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-300">
                        Inquilino: {contrato.inquilino?.nombre} {contrato.inquilino?.apellido}
                      </CardDescription>
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        Ultimo pago: {ultimoPago ? `${ultimoPago.mes} (${ultimoPago.estado})` : "Sin registrar"}
                      </p>
                    </div>
                    <StatusBadge status={contrato.estado} />
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Monto total del alquiler</p>
                      <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(contrato.montoTotalAlquiler)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Comisión inmobiliaria</p>
                      <p className="font-medium text-slate-900 dark:text-white">{contrato.porcentajeComisionInmobiliaria}%</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Vencimiento</p>
                      <p>Dia {contrato.diaVencimiento}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Pagos pendientes</p>
                      <p>{pagosPendientes}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Inicio</p>
                      <p>{formatDate(contrato.fechaInicio)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Fin</p>
                      <p>{formatDate(contrato.fechaFin)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Ultimo ajuste</p>
                      <p>{formatDate(contrato.fechaUltimoAjuste)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Proximo ajuste</p>
                      <p>{proximoAjusteDate ? formatDate(proximoAjusteDate.toISOString()) : "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-100 p-4 transition-colors dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Editar datos principales</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Monto total del alquiler</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editor.montoTotalAlquiler}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, montoTotalAlquiler: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Comisión inmobiliaria (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={editor.porcentajeComisionInmobiliaria}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, porcentajeComisionInmobiliaria: event.target.value },
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
                        <Label>Ultimo ajuste</Label>
                        <Input
                          type="date"
                          value={editor.fechaUltimoAjuste}
                          onChange={(event) =>
                            setEditorForms((prev) => ({
                              ...prev,
                              [contrato.id]: { ...editor, fechaUltimoAjuste: event.target.value },
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


                  <div className="space-y-4 rounded-2xl border border-slate-100 p-4 transition-colors dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Calcular y aplicar ajuste</p>
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
                    {ajuste.detalle && <p className="text-xs text-slate-500 dark:text-slate-400">{ajuste.detalle}</p>}
                  </div>
                </Card>
              );
            })}
          </div>
          {contratosOrdenados.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Todavia no hay contratos cargados.
            </p>
          )}
        </section>
        )}
        {activeSection === "discounts" && (
          <section id="discounts" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Solicitudes de descuento</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Aprueba o rechaza los casos enviados por inquilinos.</p>
          </div>
          <div className="space-y-4">
            {discountsState.map((descuento) => (
              <Card
                key={descuento.id}
                className="space-y-4 rounded-3xl border-slate-200 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base">{formatCurrency(descuento.monto)}</CardTitle>
                    <CardDescription>
                      {descuento.motivo} - {descuento.contrato.direccion} - {descuento.contrato.inquilino?.nombre} {descuento.contrato.inquilino?.apellido}
                    </CardDescription>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Solicitado el {formatDate(descuento.createdAt)}</p>
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
              <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No hay solicitudes de descuento por ahora.
              </p>
            )}
          </div>
        </section>
        )}
        {activeSection === "transfers" && (
          <section id="transfers" className="space-y-6">
            {userRole === UserRole.SUPER_ADMIN ? (
              <TransferenciasPendientesList inmobiliariaId={contratos[0]?.inmobiliariaId || ""} />
            ) : (
              <TransferenciasInmobiliariaList transferencias={transferencias} />
            )}
          </section>
        )}
        {activeSection === "configuracion-pagos" && (
          <section id="configuracion-pagos" className="space-y-6">
            {userRole === UserRole.SUPER_ADMIN ? (
              <>
                <ConfiguracionPagosForm inmobiliariaId={contratos[0]?.inmobiliariaId || ""} />
                <div className="mt-8">
                  <TransferenciasPendientesList inmobiliariaId={contratos[0]?.inmobiliariaId || ""} />
                </div>
              </>
            ) : (
              <ConfiguracionPagosForm inmobiliariaId={contratos[0]?.inmobiliariaId || ""} readonly={true} />
            )}
          </section>
        )}
      </main>
    </div>
    </>
  );
};





































