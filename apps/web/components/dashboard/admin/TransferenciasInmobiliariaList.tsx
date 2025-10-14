"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransferenciaManual } from "@/lib/types";
import { TransferenciaEstado } from "@admin-inmo/shared";
import { Eye, FileText, Calendar, User, MapPin, DollarSign } from "lucide-react";

interface TransferenciasInmobiliariaListProps {
  transferencias: TransferenciaManual[];
}

export const TransferenciasInmobiliariaList = ({ transferencias }: TransferenciasInmobiliariaListProps) => {
  const [selectedTransferencia, setSelectedTransferencia] = useState<TransferenciaManual | null>(null);

  const getEstadoBadge = (estado: TransferenciaEstado) => {
    return <StatusBadge status={estado} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (transferencias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transferencias de la Inmobiliaria
          </CardTitle>
          <CardDescription>
            Aquí puedes ver el estado de todas las transferencias de tu inmobiliaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay transferencias registradas para tu inmobiliaria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transferencias de la Inmobiliaria
          </CardTitle>
          <CardDescription>
            Aquí puedes ver el estado de todas las transferencias de tu inmobiliaria (solo lectura)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transferencias.map((transferencia) => (
              <div
                key={transferencia.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{transferencia.pago.contrato.direccion}</span>
                      {getEstadoBadge(transferencia.verificado)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          <strong>Inquilino:</strong> {transferencia.pago.contrato.inquilino.nombre} {transferencia.pago.contrato.inquilino.apellido}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          <strong>Mes:</strong> {transferencia.pago.mes}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          <strong>Monto:</strong> ${Number(transferencia.pago.monto).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>
                          <strong>ID Ref:</strong> {transferencia.pago.externalId}
                        </span>
                      </div>
                    </div>

                    {transferencia.comentario && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <strong>Comentario:</strong> {transferencia.comentario}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Creado: {formatDate(transferencia.createdAt)}
                      {transferencia.verificadoAt && (
                        <span className="ml-4">
                          Verificado: {formatDate(transferencia.verificadoAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {transferencia.comprobantePath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTransferencia(transferencia)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Comprobante
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver comprobante */}
      {selectedTransferencia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Comprobante de Transferencia</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransferencia(null)}
                >
                  Cerrar
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Propiedad:</strong> {selectedTransferencia.pago.contrato.direccion}
                  </div>
                  <div>
                    <strong>Inquilino:</strong> {selectedTransferencia.pago.contrato.inquilino.nombre} {selectedTransferencia.pago.contrato.inquilino.apellido}
                  </div>
                  <div>
                    <strong>Mes:</strong> {selectedTransferencia.pago.mes}
                  </div>
                  <div>
                    <strong>Monto:</strong> ${Number(selectedTransferencia.pago.monto).toLocaleString()}
                  </div>
                  <div>
                    <strong>ID Referencia:</strong> {selectedTransferencia.pago.externalId}
                  </div>
                  <div>
                    <strong>Estado:</strong> {getEstadoBadge(selectedTransferencia.verificado)}
                  </div>
                </div>

                {selectedTransferencia.comprobantePath && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Comprobante:</h4>
                    <div className="border rounded p-4 bg-muted/50">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/transferencias/${selectedTransferencia.id}/comprobante`}
                        alt="Comprobante de transferencia"
                        className="max-w-full h-auto rounded"
                        style={{ maxHeight: '400px' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center p-4 text-gray-500">
                                <div class="text-center">
                                  <p class="text-sm">No se pudo cargar la imagen</p>
                                  <a href="${target.src}" target="_blank" class="text-blue-600 hover:underline mt-2 inline-block">
                                    Abrir en nueva pestaña
                                  </a>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {selectedTransferencia.comentario && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Comentario:</h4>
                    <p className="text-sm text-muted-foreground">{selectedTransferencia.comentario}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
