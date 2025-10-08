"use client";

import { useEffect, useMemo, useState } from "react";
import { Contrato, Descuento, Pago } from "@/lib/types";
import { clientApiFetch } from "@/lib/client-api";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [comentarioTransferencia, setComentarioTransferencia] = useState("");
  const [descuentoMonto, setDescuentoMonto] = useState("");
  const [descuentoMotivo, setDescuentoMotivo] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [descuentoSubmitting, setDescuentoSubmitting] = useState(false);
  const [mostrarFormularioDescuento, setMostrarFormularioDescuento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedContratoId) {
      setPagos([]);
      setDescuentos([]);
      return;
    }

    setError(null);
    setMensaje(null);
    setPagosLoading(true);
    clientApiFetch<Pago[]>(`/api/contratos/${selectedContratoId}/pagos`)
      .then(setPagos)
      .catch((err) => setError((prev) => prev ?? err.message))
      .finally(() => setPagosLoading(false));

    setDescuentosLoading(true);
    clientApiFetch<Descuento[]>(`/api/contratos/${selectedContratoId}/descuentos`)
      .then(setDescuentos)
      .catch((err) => setError((prev) => prev ?? err.message))
      .finally(() => setDescuentosLoading(false));
  }, [selectedContratoId]);

  const contrato = useMemo(
    () => contratos.find((c) => c.id === selectedContratoId) ?? null,
    [contratos, selectedContratoId]
  );

  const pendingPago = useMemo(() => {
    const pendientes = pagos.filter((p) => p.estado === "PENDIENTE");
    if (pendientes.length === 0) {
      return null;
    }
    return pendientes.reduce((menor, actual) => (comparePeriod(actual.mes, menor.mes) < 0 ? actual : menor));
  }, [pagos]);

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

  const montoBase = pendingPago ? Number(pendingPago.monto) : Number(contrato?.montoMensual ?? 0);
  const comision = Number(contrato?.comisionMensual ?? 0);
  const totalAPagar = montoBase + comision;

  const siguienteMonto = formatCurrency(totalAPagar);

  const handleMercadoPago = async () => {
    if (!pendingPago) return;
    try {
      const preference = await clientApiFetch<{ init_point: string }>(`/api/pagos/${pendingPago.id}/mp/preference`, {
        method: "POST",
      });
      window.location.href = preference.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago");
    }
  };

  const recargarPagos = async (contratoId: string) => {
    setPagosLoading(true);
    try {
      const refreshed = await clientApiFetch<Pago[]>(`/api/contratos/${contratoId}/pagos`);
      setPagos(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar los pagos");
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
      setError(err instanceof Error ? err.message : "No se pudo actualizar los descuentos");
    } finally {
      setDescuentosLoading(false);
    }
  };

  const handleTransferSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingPago || !transferFile) {
      setError("Selecciona un comprobante antes de enviar");
      return;
    }
    setError(null);
    setMensaje(null);
    setTransferSubmitting(true);

    const formData = new FormData();
    formData.append("comprobante", transferFile);
    if (comentarioTransferencia) {
      formData.append("comentario", comentarioTransferencia);
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const response = await fetch(`${baseUrl}/api/pagos/${pendingPago.id}/transferencia`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo enviar el comprobante");
      }
      setMensaje("Comprobante enviado para validacion");
      setTransferFile(null);
      setComentarioTransferencia("");
      await recargarPagos(pendingPago.contratoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el comprobante");
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleSolicitarDescuento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedContratoId) return;
    const monto = Number(descuentoMonto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError("Indica un monto valido");
      return;
    }
    if (descuentoMotivo.trim().length < 3) {
      setError("Conta brevemente el motivo del descuento");
      return;
    }

    setError(null);
    setMensaje(null);
    setDescuentoSubmitting(true);
    try {
      await clientApiFetch(`/api/contratos/${selectedContratoId}/descuentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto, motivo: descuentoMotivo.trim() }),
      });
      setMensaje("Solicitud de descuento enviada");
      setDescuentoMonto("");
      setDescuentoMotivo("");
      setMostrarFormularioDescuento(false);
      await recargarDescuentos(selectedContratoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el descuento");
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
          <div className="w-full max-w-xs space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <Label htmlFor="contrato" className="text-slate-200">
              Selecciona el contrato a visualizar
            </Label>
            <Select
              id="contrato"
              value={selectedContratoId ?? ""}
              onChange={(event) => setSelectedContratoId(event.target.value || null)}
              className="rounded-xl border-white/30 bg-white/10 text-white"
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
            <dt className="text-xs uppercase tracking-wide text-slate-300">Total a pagar (alquiler + comision)</dt>
            <dd className="text-sm font-medium text-white">{siguienteMonto}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-300 sm:text-sm">
          Incluye {formatCurrency(contrato.montoMensual ?? 0)} de alquiler y {formatCurrency(comision)} de comision.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
        <Card className="h-full overflow-hidden rounded-3xl border-slate-200 p-6 shadow-md">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Pagos y comprobantes</CardTitle>
            {pendingPago && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Pendiente {pendingPago.mes}: {formatCurrency(totalAPagar)}
              </span>
            )}
          </div>

          {pagosLoading ? (
            <p className="mt-4 text-sm text-slate-500">Cargando pagos...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Mes {pago.mes}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(pago.monto)}</p>
                  </div>
                  <StatusBadge status={pago.estado} />
                </div>
              ))}
              {pagos.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Todavia no hay pagos registrados.
                </p>
              )}
            </div>
          )}

          {pendingPago && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Completar el pago de {pendingPago.mes}</p>
              <p className="mb-4 text-xs text-slate-500">
                Total a pagar: {formatCurrency(totalAPagar)} (alquiler {formatCurrency(montoBase)} + comision{" "}
                {formatCurrency(comision)}). Elegi el metodo que prefieras y, si usas transferencia, sube el comprobante
                para validarlo.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handleMercadoPago} className="sm:w-auto">
                  Pagar con Mercado Pago
                </Button>
                <span className="text-xs text-slate-500">o carga el comprobante de transferencia</span>
              </div>
              <form onSubmit={handleTransferSubmit} className="mt-4 grid gap-3" encType="multipart/form-data">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="transfer-file">Comprobante</Label>
                    <Input
                      id="transfer-file"
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(event) => setTransferFile(event.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="transfer-comment">Comentario (opcional)</Label>
                    <Input
                      id="transfer-comment"
                      value={comentarioTransferencia}
                      onChange={(event) => setComentarioTransferencia(event.target.value)}
                      placeholder="Ej. Banco y referencia"
                    />
                  </div>
                </div>
                <Button type="submit" variant="outline" disabled={!transferFile || transferSubmitting}>
                  {transferSubmitting ? "Enviando..." : "Enviar comprobante"}
                </Button>
              </form>
            </div>
          )}
        </Card>

        <Card className="h-full rounded-3xl border-slate-200 p-6 shadow-md">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Descuentos solicitados</CardTitle>
            <Button
              type="button"
              variant={mostrarFormularioDescuento ? "outline" : "default"}
              onClick={() => setMostrarFormularioDescuento((value) => !value)}
              className="sm:w-auto"
            >
              {mostrarFormularioDescuento ? "Cancelar" : "Solicitar descuento"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Solicitalo cuando debas descontar expensas extraordinarias o arreglos asumidos por tu cuenta.
          </p>

          {mostrarFormularioDescuento && (
            <form className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleSolicitarDescuento}>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label htmlFor="descuento-monto">Monto a descontar</Label>
                  <Input
                    id="descuento-monto"
                    type="number"
                    min={0}
                    step="0.01"
                    value={descuentoMonto}
                    onChange={(event) => setDescuentoMonto(event.target.value)}
                    placeholder="Ej. 15000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="descuento-motivo">Detalle</Label>
                  <Textarea
                    id="descuento-motivo"
                    value={descuentoMotivo}
                    onChange={(event) => setDescuentoMotivo(event.target.value)}
                    placeholder="Contanos brevemente el motivo"
                    rows={3}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={descuentoSubmitting}>
                {descuentoSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>
          )}

          <div className="mt-4 space-y-3">
            {descuentosLoading ? (
              <p className="text-sm text-slate-500">Cargando descuentos...</p>
            ) : descuentos.length > 0 ? (
              descuentos.map((descuento) => (
                <div
                  key={descuento.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(descuento.monto)}</p>
                    <p className="text-xs text-slate-500">{descuento.motivo}</p>
                    <p className="text-xs text-slate-400">Solicitado el {formatDate(descuento.createdAt)}</p>
                  </div>
                  <StatusBadge status={descuento.estado} />
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Todavia no solicitaste descuentos.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Inicio</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(contrato.fechaInicio)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Fin</p>
          <p className="text-sm font-medium text-slate-900">{formatDate(contrato.fechaFin)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Frecuencia de ajuste</p>
          <p className="text-sm font-medium text-slate-900">{ajustesLabel}</p>
        </div>
      </section>

      {(mensaje || error) && (
        <p className={`text-sm ${mensaje ? "text-emerald-600" : "text-rose-600"}`}>{mensaje ?? error}</p>
      )}
    </div>
  );
};






