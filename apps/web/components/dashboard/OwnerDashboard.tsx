"use client";

import { Contrato } from "@/lib/types";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

interface OwnerDashboardProps {
  contratos: Contrato[];
  propietarioId: string;
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

export const OwnerDashboard = ({ contratos, propietarioId }: OwnerDashboardProps) => {
  const totalContratos = contratos.length;
  const totalIngresos = contratos.reduce((acc, contrato) => {
    const montoTotal = Number(contrato.montoTotalAlquiler ?? 0);
    const porcentajeComision = Number(contrato.porcentajeComisionInmobiliaria ?? 0);
    const comisionInmobiliaria = (montoTotal * porcentajeComision) / 100;
    return acc + (montoTotal - comisionInmobiliaria); // El propietario recibe el total menos la comisión
  }, 0);
  const totalComisiones = contratos.reduce((acc, contrato) => {
    const montoTotal = Number(contrato.montoTotalAlquiler ?? 0);
    const porcentajeComision = Number(contrato.porcentajeComisionInmobiliaria ?? 0);
    const comisionInmobiliaria = (montoTotal * porcentajeComision) / 100;
    return acc + comisionInmobiliaria;
  }, 0);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tu cartera</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Seguimiento tranquilo, sin sobresaltos</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Visualiza todos tus contratos activos, con montos, comisiones y fechas clave en un solo lugar. La gestion de
            montos y ajustes la realiza el equipo de administracion para garantizar consistencia y tranquilidad.
          </p>
        </div>
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wider text-slate-300">Contratos activos</dt>
            <dd className="text-2xl font-semibold">{totalContratos}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wider text-slate-300">Monto mensual total</dt>
            <dd className="text-2xl font-semibold">{formatCurrency(totalIngresos)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <dt className="text-xs uppercase tracking-wider text-slate-300">Comision inmobiliaria</dt>
            <dd className="text-2xl font-semibold">{formatCurrency(totalComisiones)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Detalle de contratos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recordatorio: los ajustes se gestionan desde la cuenta de administrador para mantener coherencia y
            transparencia.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {contratos.map((contrato) => (
            <Card key={contrato.id} className="flex h-full flex-col justify-between rounded-2xl border-slate-200 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">{contrato.direccion}</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      Inquilino: {contrato.inquilino?.nombre} {contrato.inquilino?.apellido}
                    </CardDescription>
                  </div>
                  <StatusBadge status={contrato.estado} />
                </div>
                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 dark:text-slate-300">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Monto total del alquiler</p>
                    <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(contrato.montoTotalAlquiler)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Comisión inmobiliaria</p>
                    <p className="font-medium text-slate-900 dark:text-white">{contrato.porcentajeComisionInmobiliaria}%</p>
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
                    <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Vencimiento</p>
                    <p>Dia {contrato.diaVencimiento}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Ajuste</p>
                    <p>Cada {contrato.ajusteFrecuenciaMeses} meses</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {contratos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Todavia no tenes contratos asignados. El equipo de administracion los vinculara aqui cuando esten listos.
          </div>
        )}
      </section>

    </div>
  );
};
