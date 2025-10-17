"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Receipt } from "lucide-react";
import { Contrato, Descuento, Pago } from "@/lib/types";
import { clientApiFetch } from "@/lib/client-api";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { ConfiguracionPagosInquilino } from "./ConfiguracionPagosInquilino";
import { ConfiguracionPagosDualInquilino } from "./ConfiguracionPagosDualInquilino";

interface TenantDashboardProps {
  contratos: Contrato[];
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

const normaliseDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const TenantDashboard = ({ contratos }: TenantDashboardProps) => {
  const [selectedContratoId, setSelectedContratoId] = useState<string | null>(contratos[0]?.id ?? null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [pagosLoading, setPagosLoading] = useState(false);
  const [descuentosLoading, setDescuentosLoading] = useState(false);
  const [comprobantePropietario, setComprobantePropietario] = useState<File | null>(null);
  const [comprobanteInmobiliaria, setComprobanteInmobiliaria] = useState<File | null>(null);
  // Campos removidos: solo necesitamos imagen + externalId del pago
  const [descuentoMonto, setDescuentoMonto] = useState("");
  const [descuentoMotivo, setDescuentoMotivo] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [descuentoSubmitting, setDescuentoSubmitting] = useState(false);
  const [modalDescuentoOpen, setModalDescuentoOpen] = useState(false);

  const handleComprobanteChange = (tipo: 'propietario' | 'inmobiliaria', file: File | null) => {
    if (tipo === 'propietario') {
      setComprobantePropietario(file);
    } else {
      setComprobanteInmobiliaria(file);
    }
  };

  const handleSubmitComprobante = async (tipo: 'propietario' | 'inmobiliaria') => {
    if (!pendingPago) {
      toast.error("No hay pago pendiente");
      return;
    }

    const comprobante = tipo === 'propietario' ? comprobantePropietario : comprobanteInmobiliaria;
    if (!comprobante) {
      toast.error("Debes subir el comprobante primero");
      return;
    }

    setTransferSubmitting(true);

    try {
      let pagoId = pendingPago.id;
      
      // Si es un pago virtual, primero generamos el pago real
      if (pendingPago.id.startsWith('virtual-')) {
        const generateResponse = await clientApiFetch<Pago>(`/api/pagos/generar`, {
          method: "POST",
          body: JSON.stringify({
            contratoId: pendingPago.contratoId,
            mes: pendingPago.mes,
            monto: Number(pendingPago.monto)
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        pagoId = generateResponse.id;
        toast.success("Pago generado correctamente");
      }

      const formData = new FormData();
      if (tipo === 'propietario') {
        formData.append("comprobantePropietario", comprobante);
      } else {
        formData.append("comprobanteInmobiliaria", comprobante);
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const response = await fetch(`${baseUrl}/api/pagos/${pagoId}/transferencia`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo enviar el comprobante");
      }
      toast.success(`Comprobante de ${tipo === 'propietario' ? 'Propietario' : 'Inmobiliaria'} enviado correctamente`);
      
      // Limpiar el comprobante enviado
      if (tipo === 'propietario') {
        setComprobantePropietario(null);
      } else {
        setComprobanteInmobiliaria(null);
      }
      
      await recargarPagos(pendingPago.contratoId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar el comprobante";
      toast.error(message);
    } finally {
      setTransferSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedContratoId) {
      setPagos([]);
      setDescuentos([]);
      return;
    }

    let errorReported = false;
    const reportError = (error: unknown, fallback: string) => {
      if (errorReported) return;
      const message = error instanceof Error && error.message ? error.message : fallback;
      toast.error(message);
      errorReported = true;
    };

    setPagosLoading(true);
    clientApiFetch<Pago[]>(`/api/contratos/${selectedContratoId}/pagos`)
      .then(setPagos)
      .catch((err) => reportError(err, "No se pudieron cargar los pagos"))
      .finally(() => setPagosLoading(false));

    setDescuentosLoading(true);
    clientApiFetch<Descuento[]>(`/api/contratos/${selectedContratoId}/descuentos`)
      .then(setDescuentos)
      .catch((err) => reportError(err, "No se pudieron cargar los descuentos"))
      .finally(() => setDescuentosLoading(false));
  }, [selectedContratoId]);

  const contrato = useMemo(
    () => contratos.find((c) => c.id === selectedContratoId) ?? null,
    [contratos, selectedContratoId]
  );

  const pendingPago = useMemo(() => {
    const pendientes = pagos.filter((p) => p.estado === "PENDIENTE");
    if (pendientes.length === 0) {
      // Si no hay pagos pendientes pero hay contrato activo, crear un pago virtual para mostrar la funcionalidad
      if (contrato) {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        // Verificar si ya existe un pago para este mes
        const existingPago = pagos.find(p => p.mes === currentMonth);
        if (!existingPago) {
          // Crear un pago virtual para mostrar la funcionalidad
          // Usar un externalId fijo basado en el contrato y mes para evitar problemas de hidratación
          const virtualExternalId = `ALQ-${currentMonth.replace('-', '')}-${contrato.id.slice(-8)}`;
          return {
            id: `virtual-${currentMonth}`,
            contratoId: contrato.id,
            mes: currentMonth,
            monto: contrato.montoTotalAlquiler.toString(),
            estado: "PENDIENTE" as const,
            fechaPago: null,
            metodoPago: null,
            externalId: virtualExternalId
          };
        }
      }
      return null;
    }
    return pendientes.reduce((menor, actual) => (comparePeriod(actual.mes, menor.mes) < 0 ? actual : menor));
  }, [pagos, contrato]);

  const dueDate = useMemo(() => {
    if (!contrato) return null;
    if (pendingPago) {
      const [year, month] = pendingPago.mes.split("-").map(Number);
      if (!year || !month) return null;
      return new Date(year, month - 1, contrato.diaVencimiento ?? 1);
    }
    const today = new Date();
    const candidate = new Date(today.getFullYear(), today.getMonth(), contrato.diaVencimiento ?? 1);
    if (candidate < today) {
      return new Date(today.getFullYear(), today.getMonth() + 1, contrato.diaVencimiento ?? 1);
    }
    return candidate;
  }, [contrato, pendingPago]);

  const daysUntilDue = useMemo(() => {
    if (!dueDate) return null;
    const today = normaliseDate(new Date());
    const due = normaliseDate(dueDate);
    const diff = due.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [dueDate]);

  const dueDateLabel = dueDate
    ? dueDate.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })
    : "-";

  const daysLabel =
    daysUntilDue === null
      ? "-"
      : daysUntilDue > 1
        ? `${daysUntilDue} dias`
        : daysUntilDue === 1
          ? "1 dia"
          : daysUntilDue === 0
            ? "Hoy"
            : `Hace ${Math.abs(daysUntilDue)} dias`;

  const montoBase = pendingPago ? Number(pendingPago.monto) : Number(contrato?.montoTotalAlquiler ?? 0);
  const comisionInmobiliaria = Number(contrato?.porcentajeComisionInmobiliaria ?? 0);
  const totalAPagar = montoBase; // El inquilino solo ve el monto total del alquiler

  const siguienteMonto = formatCurrency(totalAPagar);


  const recargarPagos = async (contratoId: string) => {
    setPagosLoading(true);
    try {
      const refreshed = await clientApiFetch<Pago[]>(`/api/contratos/${contratoId}/pagos`);
      setPagos(refreshed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron actualizar los pagos";
      toast.error(message);
    } finally {
      setPagosLoading(false);
    }
  };

  const recargarDescuentos = async (contratoId: string) => {
    setDescuentosLoading(true);
    try {
      const refreshed = await clientApiFetch<Descuento[]>(`/api/contratos/${contratoId}/descuentos`);
      setDescuentos(refreshed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron actualizar los descuentos";
      toast.error(message);
    } finally {
      setDescuentosLoading(false);
    }
  };

  const handleSolicitarDescuento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedContratoId) return;
    const monto = Number(descuentoMonto);
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("Indica un monto valido");
      return;
    }
    if (descuentoMotivo.trim().length < 3) {
      toast.error("Conta brevemente el motivo del descuento");
      return;
    }

    setDescuentoSubmitting(true);
    try {
      await clientApiFetch(`/api/contratos/${selectedContratoId}/descuentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto, motivo: descuentoMotivo.trim() }),
      });
      toast.success("Solicitud de descuento enviada");
      setDescuentoMonto("");
      setDescuentoMotivo("");
      setModalDescuentoOpen(false);
      await recargarDescuentos(selectedContratoId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar el descuento";
      toast.error(message);
    } finally {
      setDescuentoSubmitting(false);
    }
  };

  if (contratos.length === 0 || !selectedContratoId || !contrato) {
    return <p>No tenes contratos asignados todavia.</p>;
  }

  const ajustesLabel =
    contrato.ajusteFrecuenciaMeses === 1
      ? "Ajuste mensual"
      : `Ajuste cada ${contrato.ajusteFrecuenciaMeses} meses`;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tu contrato</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Gestiona el alquiler con calma</h2>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Revisa vencimientos, montos y beneficios. Si tenes algun gasto extraordinario, podes enviar la solicitud de
              descuento y el equipo lo revisa cuanto antes.
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Label htmlFor="contrato" className="text-slate-200 text-xs uppercase tracking-wider font-semibold">
              Selecciona el contrato a visualizar
            </Label>
            <Select
              id="contrato"
              value={selectedContratoId ?? ""}
              onChange={(event) => setSelectedContratoId(event.target.value || null)}
              className="!bg-slate-800/90 !border-white/20 !text-white hover:!bg-slate-700/90 hover:!border-white/30 focus:!border-white/50 focus:!ring-white/20 shadow-lg backdrop-blur-md [&>option]:!bg-slate-800 [&>option]:!text-white [&>option:checked]:!bg-slate-700"
            >
              {contratos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.direccion}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wide text-slate-300">Direccion</dt>
            <dd className="text-sm font-medium text-white">{contrato.direccion}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wide text-slate-300">Proximo vencimiento</dt>
            <dd className="text-sm font-medium text-white">{dueDateLabel}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wide text-slate-300">Dias restantes</dt>
            <dd className="text-sm font-medium text-white">{daysLabel}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wide text-slate-300">Total a pagar</dt>
            <dd className="text-sm font-medium text-white">{siguienteMonto}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-300 sm:text-sm">
          Monto total del alquiler: {formatCurrency(contrato.montoTotalAlquiler ?? 0)}.
        </p>
      </section>

      {/* Sección de Pago con Transferencias */}
      {pendingPago && (
        <section className="space-y-6">
          {/* Mostrar el total a pagar destacado con botón de descuento */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-2 border-primary/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Pago del mes {pendingPago.mes}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totalAPagar)}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ID de Referencia</p>
                  <p className="font-mono text-sm font-bold text-primary bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                    {pendingPago.externalId}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalDescuentoOpen(true)}
                  className="whitespace-nowrap"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Solicitar descuento
                </Button>
              </div>
            </div>
          </div>
          
          <ConfiguracionPagosDualInquilino 
            inmobiliariaId={contratos.find(c => c.id === selectedContratoId)?.inmobiliariaId || ""} 
            onComprobanteChange={handleComprobanteChange}
            comprobantePropietario={comprobantePropietario}
            comprobanteInmobiliaria={comprobanteInmobiliaria}
            onSubmitComprobante={handleSubmitComprobante}
            isSubmitting={transferSubmitting}
          />
        </section>
      )}

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Inicio</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(contrato.fechaInicio)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Fin</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(contrato.fechaFin)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Frecuencia de ajuste</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{ajustesLabel}</p>
        </div>
      </section>

      {/* Modal de Solicitar Descuento */}
      <Dialog open={modalDescuentoOpen} onOpenChange={setModalDescuentoOpen}>
        <DialogContent onClose={() => setModalDescuentoOpen(false)}>
          <DialogHeader>
            <DialogTitle>Solicitar Descuento</DialogTitle>
            <DialogDescription>
              Solicitalo cuando debas descontar expensas extraordinarias o arreglos asumidos por tu cuenta
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSolicitarDescuento}>
            <DialogBody>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-descuento-monto">Monto a descontar</Label>
                  <Input
                    id="modal-descuento-monto"
                    type="number"
                    min={0}
                    step="0.01"
                    value={descuentoMonto}
                    onChange={(event) => setDescuentoMonto(event.target.value)}
                    placeholder="Ej. 15000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-descuento-motivo">Detalle</Label>
                  <Textarea
                    id="modal-descuento-motivo"
                    value={descuentoMotivo}
                    onChange={(event) => setDescuentoMotivo(event.target.value)}
                    placeholder="Contanos brevemente el motivo del descuento"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </DialogBody>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setModalDescuentoOpen(false)}
                disabled={descuentoSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={descuentoSubmitting}>
                {descuentoSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};






