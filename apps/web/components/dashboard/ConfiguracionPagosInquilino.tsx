"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/client-api";
import { ConfiguracionPagosPublica } from "@admin-inmo/shared";
import { Copy, Check, QrCode } from "lucide-react";
import { toast } from "@/lib/toast";

interface ConfiguracionPagosInquilinoProps {
  inmobiliariaId: string;
}

export const ConfiguracionPagosInquilino = ({ inmobiliariaId }: ConfiguracionPagosInquilinoProps) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionPagosPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadConfiguracion();
  }, [inmobiliariaId]);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/publica/${inmobiliariaId}`);
      setConfiguracion(response as ConfiguracionPagosPublica);
    } catch (error) {
      console.error("Error cargando configuración de pagos:", error);
      // No mostrar error si no hay configuración
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("CBU copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copiando al portapapeles:", error);
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!configuracion) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Datos para Transferencia
        </CardTitle>
        <CardDescription>
          Realiza la transferencia a estos datos y luego sube el comprobante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">CBU:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(configuracion.cbuDestino)}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="font-mono text-lg text-slate-900 dark:text-white break-all">
            {configuracion.cbuDestino}
          </p>
        </div>

        {configuracion.aliasCbu && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">Alias:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(configuracion.aliasCbu!)}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="font-mono text-lg text-slate-900 dark:text-white">
              {configuracion.aliasCbu}
            </p>
          </div>
        )}

        {configuracion.banco && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <span className="font-medium text-slate-700 dark:text-slate-300">Banco:</span>
            <p className="text-slate-900 dark:text-white mt-1">{configuracion.banco}</p>
          </div>
        )}

        {configuracion.qrCode && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
            <span className="font-medium text-slate-700 dark:text-slate-300 block mb-2">
              Código QR:
            </span>
            <img 
              src={`data:image/png;base64,${configuracion.qrCode}`} 
              alt="QR Code para transferencia"
              className="mx-auto w-48 h-48 border border-slate-300 rounded-lg"
            />
            <p className="text-sm text-slate-500 mt-2">
              Escanea este código QR con tu app bancaria
            </p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Instrucciones:
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Realiza la transferencia al CBU indicado</li>
            <li>2. Completa los datos del comprobante abajo</li>
            <li>3. Sube una foto del comprobante (opcional)</li>
            <li>4. Espera la verificación del administrador</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
