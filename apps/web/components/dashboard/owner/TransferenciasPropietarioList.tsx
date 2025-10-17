"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { clientApiFetch } from "@/lib/client-api";
import { toast } from "@/lib/toast";
import { TransferenciaManual, TransferenciaEstado, UserRole } from "@admin-inmo/shared";
import { CheckCircle, XCircle, DollarSign, Eye, User, Building } from "lucide-react";

interface TransferenciasPropietarioListProps {
  propietarioId: string;
  userRole?: UserRole;
}

interface TransferenciaCompleta {
  id: string;
  pagoId: string;
  comprobantePath?: string;
  comprobantePropietarioPath?: string;
  comprobanteInmobiliariaPath?: string;
  verificado: TransferenciaEstado;
  verificadoPorId?: string;
  verificadoAt?: string;
  comentario?: string;
  transferenciaPropietarioId?: string;
  transferenciaInmobiliariaId?: string;
  verificaciones?: {
    id: string;
    tipoComprobante: string;
    verificado: boolean;
    verificadoPorId: string;
    verificadoAt: string;
    comentario?: string;
    verificadoPor: {
      nombre: string;
      apellido: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  pago: {
    id: string;
    mes: string;
    monto: number;
    comision: number;
    externalId: string;
    contrato: {
      id: string;
      direccion: string;
      inmobiliaria: {
        id: string;
        nombre: string;
      };
      propietario: {
        id: string;
        nombre: string;
        apellido: string;
        cbu?: string;
        banco?: string;
      };
      inquilino: {
        nombre: string;
        apellido: string;
      };
    };
  };
}

export const TransferenciasPropietarioList = ({ propietarioId, userRole }: TransferenciasPropietarioListProps) => {
  const [transferencias, setTransferencias] = useState<TransferenciaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTransferencias();
  }, [propietarioId]);

  const loadTransferencias = async () => {
    try {
      setLoading(true);
      // El propietario solo ve transferencias donde él es el propietario
      const response = await clientApiFetch(`/api/pagos/transferencias-propietario/${propietarioId}`);
      setTransferencias((response as TransferenciaCompleta[]) || []);
    } catch (error) {
      console.error("Error cargando transferencias:", error);
      toast.error("Error al cargar transferencias");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async (pagoId: string, verificado: boolean) => {
    try {
      setVerificando(pagoId);
      await clientApiFetch(`/api/pagos/${pagoId}/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificado,
          comentario: comentarios[pagoId] || undefined,
        }),
      });
      
      toast.success(verificado ? "Transferencia verificada" : "Transferencia rechazada");
      await loadTransferencias();
    } catch (error) {
      console.error("Error verificando transferencia:", error);
      toast.error("Error al verificar la transferencia");
    } finally {
      setVerificando(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const getEstadoBadge = (estado: TransferenciaEstado) => {
    const labels = {
      [TransferenciaEstado.PENDIENTE_VERIFICACION]: "PENDIENTE",
      [TransferenciaEstado.VERIFICADO]: "VERIFICADO",
      [TransferenciaEstado.APROBADO]: "APROBADO",
      [TransferenciaEstado.RECHAZADO]: "RECHAZADO",
    };

    return <StatusBadge status={labels[estado]} />;
  };

  const getVerificacionComprobante = (transferencia: TransferenciaCompleta, tipo: string) => {
    return transferencia.verificaciones?.find(v => v.tipoComprobante === tipo);
  };

  const getEstadoComprobante = (transferencia: TransferenciaCompleta, tipo: string) => {
    const verificacion = getVerificacionComprobante(transferencia, tipo);
    if (!verificacion) return "PENDIENTE";
    return verificacion.verificado ? "APROBADO" : "RECHAZADO";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transferencias.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No hay transferencias pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Mis Transferencias
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Verifica las transferencias de tus propiedades
        </p>
      </div>

      <div className="space-y-4">
        {transferencias.map((transferencia) => (
          <Card key={transferencia.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {transferencia.pago.contrato.inquilino.nombre} {transferencia.pago.contrato.inquilino.apellido}
                  </CardTitle>
                  <CardDescription>
                    Pago del mes {transferencia.pago.mes} - {transferencia.pago.contrato.direccion}
                  </CardDescription>
                </div>
                {getEstadoBadge(transferencia.verificado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4" />
                    <span>Monto Total</span>
                  </div>
                  <p className="font-semibold text-lg">{formatCurrency(transferencia.pago.monto)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Para Ti</div>
                  <p className="font-semibold text-lg">
                    {formatCurrency(transferencia.pago.monto - transferencia.pago.comision)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Para Inmobiliaria</div>
                  <p className="font-semibold text-lg">{formatCurrency(transferencia.pago.comision)}</p>
                </div>
              </div>

              {/* Solo muestra el comprobante del propietario */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Comprobante:
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Comprobante del Propietario */}
                  {transferencia.comprobantePropietarioPath && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Mi Comprobante
                          </span>
                        </div>
                        <StatusBadge status={getEstadoComprobante(transferencia, "PROPIETARIO")} />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/transferencias/${transferencia.id}/comprobante-propietario`, '_blank')}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Mi Comprobante
                      </Button>
                      {getVerificacionComprobante(transferencia, "PROPIETARIO") && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Verificado por: {getVerificacionComprobante(transferencia, "PROPIETARIO")?.verificadoPor.nombre} {getVerificacionComprobante(transferencia, "PROPIETARIO")?.verificadoPor.apellido}
                          <br />
                          {new Date(getVerificacionComprobante(transferencia, "PROPIETARIO")?.verificadoAt || '').toLocaleDateString("es-AR")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprobante legacy (para compatibilidad) */}
                  {transferencia.comprobantePath && !transferencia.comprobantePropietarioPath && (
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Mi Comprobante
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/transferencias/${transferencia.id}/comprobante`, '_blank')}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Mi Comprobante
                      </Button>
                    </div>
                  )}

                  {!transferencia.comprobantePropietarioPath && !transferencia.comprobantePath && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ No se ha subido comprobante para esta transferencia
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ID de Referencia:</strong> {transferencia.pago.externalId}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Verifica que el ID en el comprobante coincida con este ID de referencia.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Comentarios:
                </label>
                <Textarea
                  value={comentarios[transferencia.pagoId] || ""}
                  onChange={(e) => setComentarios(prev => ({
                    ...prev,
                    [transferencia.pagoId]: e.target.value,
                  }))}
                  placeholder="Agregar comentarios..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              {transferencia.verificado === TransferenciaEstado.PENDIENTE_VERIFICACION && (
                <div>
                  {transferencia.comprobantePropietarioPath && getEstadoComprobante(transferencia, "PROPIETARIO") === "PENDIENTE" ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerificar(transferencia.pagoId, true)}
                        disabled={verificando === transferencia.pagoId}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {verificando === transferencia.pagoId ? "Verificando..." : "Verificar Mi Comprobante"}
                      </Button>
                      <Button
                        onClick={() => handleVerificar(transferencia.pagoId, false)}
                        disabled={verificando === transferencia.pagoId}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  ) : !transferencia.comprobantePropietarioPath ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ No se puede verificar: falta tu comprobante
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="text-xs text-slate-500">
                Subido: {formatDate(transferencia.createdAt)}
                {transferencia.verificadoAt && (
                  <span> • Verificado: {formatDate(transferencia.verificadoAt)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
