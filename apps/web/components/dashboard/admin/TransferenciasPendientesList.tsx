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

interface TransferenciasPendientesListProps {
  inmobiliariaId: string;
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

export const TransferenciasPendientesList = ({ inmobiliariaId, userRole }: TransferenciasPendientesListProps) => {
  const [transferencias, setTransferencias] = useState<TransferenciaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState<string | null>(null);
  const [ejecutando, setEjecutando] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [transferenciaIds, setTransferenciaIds] = useState<Record<string, {
    propietario: string;
    inmobiliaria: string;
  }>>({});

  useEffect(() => {
    loadTransferencias();
  }, [inmobiliariaId]);

  const loadTransferencias = async () => {
    try {
      setLoading(true);
      const response = await clientApiFetch(`/api/pagos/transferencias-pendientes/${inmobiliariaId}`);
      setTransferencias((response as TransferenciaCompleta[]) || []);
    } catch (error) {
      console.error("Error cargando transferencias:", error);
      toast.error("Error al cargar transferencias pendientes");
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

  const handleEjecutarTransferencias = async (pagoId: string) => {
    const ids = transferenciaIds[pagoId];
    if (!ids?.propietario || !ids?.inmobiliaria) {
      toast.error("Debes ingresar los IDs de ambas transferencias");
      return;
    }

    try {
      setEjecutando(pagoId);
      await clientApiFetch(`/api/pagos/${pagoId}/ejecutar-transferencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferenciaPropietarioId: ids.propietario,
          transferenciaInmobiliariaId: ids.inmobiliaria,
          comentario: comentarios[pagoId] || undefined,
        }),
      });
      
      toast.success("Transferencias ejecutadas y pago aprobado");
      await loadTransferencias();
    } catch (error) {
      console.error("Error ejecutando transferencias:", error);
      toast.error("Error al ejecutar transferencias");
    } finally {
      setEjecutando(null);
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
        <p className="text-slate-500">No hay transferencias pendientes de verificación</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Transferencias Pendientes
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Verifica y ejecuta las transferencias manuales de los inquilinos
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
                  <div className="text-sm text-slate-600 dark:text-slate-300">Para Propietario</div>
                  <p className="font-semibold text-lg">
                    {formatCurrency(transferencia.pago.monto - transferencia.pago.comision)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-sm text-slate-600 dark:text-slate-300">Para Inmobiliaria</div>
                  <p className="font-semibold text-lg">{formatCurrency(transferencia.pago.comision)}</p>
                </div>
              </div>

              {/* Comprobantes */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Comprobantes subidos:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Comprobante del Propietario */}
                  {transferencia.comprobantePropietarioPath && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Comprobante Propietario
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
                        Ver Comprobante
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

                  {/* Comprobante de la Inmobiliaria */}
                  {transferencia.comprobanteInmobiliariaPath && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Comprobante Inmobiliaria
                          </span>
                        </div>
                        <StatusBadge status={getEstadoComprobante(transferencia, "INMOBILIARIA")} />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/transferencias/${transferencia.id}/comprobante-inmobiliaria`, '_blank')}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Comprobante
                      </Button>
                      {getVerificacionComprobante(transferencia, "INMOBILIARIA") && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Verificado por: {getVerificacionComprobante(transferencia, "INMOBILIARIA")?.verificadoPor.nombre} {getVerificacionComprobante(transferencia, "INMOBILIARIA")?.verificadoPor.apellido}
                          <br />
                          {new Date(getVerificacionComprobante(transferencia, "INMOBILIARIA")?.verificadoAt || '').toLocaleDateString("es-AR")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comprobante legacy (para compatibilidad) */}
                  {transferencia.comprobantePath && !transferencia.comprobantePropietarioPath && !transferencia.comprobanteInmobiliariaPath && (
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Comprobante (Legacy)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/transferencias/${transferencia.id}/comprobante`, '_blank')}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Comprobante
                      </Button>
                    </div>
                  )}
                </div>

                {!transferencia.comprobantePropietarioPath && !transferencia.comprobanteInmobiliariaPath && !transferencia.comprobantePath && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ No se han subido comprobantes para esta transferencia
                    </p>
                  </div>
                )}
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
                  {userRole === UserRole.ADMIN && transferencia.pago.contrato.inmobiliaria.id === inmobiliariaId && transferencia.comprobanteInmobiliariaPath && getEstadoComprobante(transferencia, "INMOBILIARIA") === "PENDIENTE" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerificar(transferencia.pagoId, true)}
                        disabled={verificando === transferencia.pagoId}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {verificando === transferencia.pagoId ? "Verificando..." : "Verificar Comprobante Inmobiliaria"}
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
                  )}
                  {userRole === UserRole.ADMIN && transferencia.pago.contrato.inmobiliaria.id === inmobiliariaId && !transferencia.comprobanteInmobiliariaPath && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ No se puede verificar: falta el comprobante de la inmobiliaria
                      </p>
                    </div>
                  )}
                  {userRole === UserRole.ADMIN && transferencia.pago.contrato.inmobiliaria.id !== inmobiliariaId && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Solo puedes verificar transferencias de tu inmobiliaria
                      </p>
                    </div>
                  )}
                </div>
              )}

              {transferencia.verificado === TransferenciaEstado.VERIFICADO && (
                <div className="space-y-4">
                  {userRole === UserRole.ADMIN && transferencia.pago.contrato.inmobiliaria.id === inmobiliariaId ? (
                    <>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Ejecutar Transferencias Manuales
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Ingresa los IDs de las transferencias que ejecutaste desde tu cuenta:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              ID Transferencia Propietario:
                            </label>
                            <input
                              type="text"
                              value={transferenciaIds[transferencia.pagoId]?.propietario || ""}
                              onChange={(e) => setTransferenciaIds(prev => ({
                                ...prev,
                                [transferencia.pagoId]: {
                                  ...prev[transferencia.pagoId],
                                  propietario: e.target.value,
                                },
                              }))}
                              placeholder="ID de transferencia al propietario"
                              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              ID Transferencia Inmobiliaria:
                            </label>
                            <input
                              type="text"
                              value={transferenciaIds[transferencia.pagoId]?.inmobiliaria || ""}
                              onChange={(e) => setTransferenciaIds(prev => ({
                                ...prev,
                                [transferencia.pagoId]: {
                                  ...prev[transferencia.pagoId],
                                  inmobiliaria: e.target.value,
                                },
                              }))}
                              placeholder="ID de transferencia a inmobiliaria"
                              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEjecutarTransferencias(transferencia.pagoId)}
                        disabled={ejecutando === transferencia.pagoId}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {ejecutando === transferencia.pagoId ? "Ejecutando..." : "Ejecutar Transferencias"}
                      </Button>
                    </>
                  ) : userRole === UserRole.ADMIN && transferencia.pago.contrato.inmobiliaria.id !== inmobiliariaId ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Solo puedes ejecutar transferencias de tu inmobiliaria
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Ejecutar Transferencias Manuales
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Ingresa los IDs de las transferencias que ejecutaste desde tu cuenta:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              ID Transferencia Propietario:
                            </label>
                            <input
                              type="text"
                              value={transferenciaIds[transferencia.pagoId]?.propietario || ""}
                              onChange={(e) => setTransferenciaIds(prev => ({
                                ...prev,
                                [transferencia.pagoId]: {
                                  ...prev[transferencia.pagoId],
                                  propietario: e.target.value,
                                },
                              }))}
                              placeholder="ID de transferencia al propietario"
                              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              ID Transferencia Inmobiliaria:
                            </label>
                            <input
                              type="text"
                              value={transferenciaIds[transferencia.pagoId]?.inmobiliaria || ""}
                              onChange={(e) => setTransferenciaIds(prev => ({
                                ...prev,
                                [transferencia.pagoId]: {
                                  ...prev[transferencia.pagoId],
                                  inmobiliaria: e.target.value,
                                },
                              }))}
                              placeholder="ID de transferencia a inmobiliaria"
                              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEjecutarTransferencias(transferencia.pagoId)}
                        disabled={ejecutando === transferencia.pagoId}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {ejecutando === transferencia.pagoId ? "Ejecutando..." : "Ejecutar Transferencias"}
                      </Button>
                    </>
                  )}
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
