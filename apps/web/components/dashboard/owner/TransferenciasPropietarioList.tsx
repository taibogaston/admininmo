"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
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

export function TransferenciasPropietarioList({ propietarioId, userRole }: TransferenciasPropietarioListProps) {
  const [transferencias, setTransferencias] = useState<TransferenciaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificandoComprobante, setVerificandoComprobante] = useState<{ transferenciaId: string; tipo: string } | null>(null);
  const [comentarioRechazo, setComentarioRechazo] = useState("");
  const [rechazandoComprobante, setRechazandoComprobante] = useState<{ transferenciaId: string; tipo: string } | null>(null);

  useEffect(() => {
    loadTransferencias();
  }, []);

  async function loadTransferencias() {
    try {
      setLoading(true);
      const response = await clientApiFetch(`/api/transferencias/pendientes`);
      setTransferencias((response as TransferenciaCompleta[]) || []);
    } catch (error) {
      console.error("Error cargando transferencias:", error);
      toast.error("Error al cargar transferencias");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerificarComprobante(transferenciaId: string, tipo: string, aprobar: boolean) {
    if (!aprobar) {
      setRechazandoComprobante({ transferenciaId, tipo });
      return;
    }

    try {
      setVerificandoComprobante({ transferenciaId, tipo });
      await clientApiFetch(`/api/transferencias/${transferenciaId}/verificar-comprobante/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aprobar: true,
        }),
      });
      
      toast.success("Tu comprobante ha sido aprobado");
      await loadTransferencias();
    } catch (error: any) {
      console.error("Error verificando comprobante:", error);
      toast.error(error.message || "Error al verificar el comprobante");
    } finally {
      setVerificandoComprobante(null);
    }
  }

  async function handleRechazarComprobante() {
    if (!rechazandoComprobante) return;
    
    if (!comentarioRechazo.trim()) {
      toast.error("Debes proporcionar un motivo para rechazar el comprobante");
      return;
    }

    try {
      const { transferenciaId, tipo } = rechazandoComprobante;
      setVerificandoComprobante({ transferenciaId, tipo });
      await clientApiFetch(`/api/transferencias/${transferenciaId}/verificar-comprobante/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aprobar: false,
          comentario: comentarioRechazo.trim(),
        }),
      });
      
      toast.success("Comprobante rechazado");
      setRechazandoComprobante(null);
      setComentarioRechazo("");
      await loadTransferencias();
    } catch (error: any) {
      console.error("Error rechazando comprobante:", error);
      toast.error(error.message || "Error al rechazar el comprobante");
    } finally {
      setVerificandoComprobante(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  }

  function getEstadoBadge(estado: TransferenciaEstado) {
    const labels = {
      [TransferenciaEstado.PENDIENTE_VERIFICACION]: "PENDIENTE",
      [TransferenciaEstado.VERIFICADO]: "VERIFICADO",
      [TransferenciaEstado.APROBADO]: "APROBADO",
      [TransferenciaEstado.RECHAZADO]: "RECHAZADO",
    };

    return <StatusBadge status={labels[estado]} />;
  }

  function getVerificacionComprobante(transferencia: TransferenciaCompleta, tipo: string) {
    return transferencia.verificaciones?.find((v) => v.tipoComprobante === tipo);
  }

  function getEstadoComprobante(transferencia: TransferenciaCompleta, tipo: string) {
    const verificacion = getVerificacionComprobante(transferencia, tipo);
    if (!verificacion) return "PENDIENTE";
    return verificacion.verificado ? "APROBADO" : "RECHAZADO";
  }

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

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Comprobante:
                </p>
                
                <div className="grid grid-cols-1 gap-3">
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
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/transferencias/${transferencia.id}/comprobante-propietario`, '_blank')}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Mi Comprobante
                        </Button>
                        
                        {!getVerificacionComprobante(transferencia, "PROPIETARIO") && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerificarComprobante(transferencia.id, "PROPIETARIO", true)}
                              disabled={verificandoComprobante?.transferenciaId === transferencia.id && verificandoComprobante?.tipo === "PROPIETARIO"}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {verificandoComprobante?.transferenciaId === transferencia.id && verificandoComprobante?.tipo === "PROPIETARIO" ? "..." : "Aprobar"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVerificarComprobante(transferencia.id, "PROPIETARIO", false)}
                              disabled={verificandoComprobante?.transferenciaId === transferencia.id && verificandoComprobante?.tipo === "PROPIETARIO"}
                              variant="outline"
                              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {getVerificacionComprobante(transferencia, "PROPIETARIO") && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          <div>Verificado por: {getVerificacionComprobante(transferencia, "PROPIETARIO")?.verificadoPor.nombre} {getVerificacionComprobante(transferencia, "PROPIETARIO")?.verificadoPor.apellido}</div>
                          <div>{new Date(getVerificacionComprobante(transferencia, "PROPIETARIO")?.verificadoAt || '').toLocaleDateString("es-AR")}</div>
                          {getVerificacionComprobante(transferencia, "PROPIETARIO")?.comentario && (
                            <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                              <strong>Motivo:</strong> {getVerificacionComprobante(transferencia, "PROPIETARIO")?.comentario}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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

      <Dialog open={rechazandoComprobante !== null} onOpenChange={(open) => !open && setRechazandoComprobante(null)}>
        <DialogContent onClose={() => setRechazandoComprobante(null)}>
          <DialogHeader>
            <DialogTitle>Rechazar Comprobante</DialogTitle>
            <DialogDescription>
              Debes proporcionar un motivo para rechazar tu comprobante
            </DialogDescription>
          </DialogHeader>
          
          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="comentario-rechazo">Motivo del rechazo</Label>
              <Textarea
                id="comentario-rechazo"
                value={comentarioRechazo}
                onChange={(e) => setComentarioRechazo(e.target.value)}
                placeholder="Ej: El comprobante tiene un error en el monto"
                rows={4}
                className="resize-none"
              />
            </div>
          </DialogBody>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRechazandoComprobante(null);
                setComentarioRechazo("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRechazarComprobante}
              disabled={!comentarioRechazo.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Rechazar Comprobante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

