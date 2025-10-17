"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/client-api";
import { Copy, Check, QrCode, Upload } from "lucide-react";
import { toast } from "@/lib/toast";

interface ConfiguracionPagosDualInquilinoProps {
  inmobiliariaId: string;
  onComprobanteChange: (tipo: 'propietario' | 'inmobiliaria', file: File | null) => void;
  comprobantePropietario: File | null;
  comprobanteInmobiliaria: File | null;
}

interface ConfiguracionPagosPublica {
  cbuDestino: string;
  aliasCbu?: string;
  banco?: string;
  qrCode?: string;
}

interface ConfiguracionPagosDualResponse {
  inmobiliaria: ConfiguracionPagosPublica | null;
  propietario: ConfiguracionPagosPublica | null;
}

export const ConfiguracionPagosDualInquilino = ({ 
  inmobiliariaId, 
  onComprobanteChange,
  comprobantePropietario,
  comprobanteInmobiliaria
}: ConfiguracionPagosDualInquilinoProps) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionPagosDualResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguracion();
  }, [inmobiliariaId]);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/publica/${inmobiliariaId}`) as ConfiguracionPagosDualResponse;
      setConfiguracion(response);
    } catch (error) {
      console.error("Error cargando configuración de pagos:", error);
      // No mostrar error si no hay configuración
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tipo);
      toast.success("CBU copiado al portapapeles");
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Error copiando al portapapeles:", error);
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  const handleFileChange = (tipo: 'propietario' | 'inmobiliaria', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onComprobanteChange(tipo, file);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!configuracion || (!configuracion.inmobiliaria && !configuracion.propietario)) {
    return null;
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Configuración de Pago al Propietario */}
      {configuracion.propietario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pago al Propietario (Alquiler)
            </CardTitle>
            <CardDescription>
              Realiza la transferencia del alquiler a estos datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">CBU:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(configuracion.propietario!.cbuDestino, 'propietario-cbu')}
                  className="h-8 w-8 p-0"
                >
                  {copied === 'propietario-cbu' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="font-mono text-lg text-slate-900 dark:text-white break-all">
                {configuracion.propietario.cbuDestino}
              </p>
            </div>

            {configuracion.propietario.aliasCbu && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Alias:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(configuracion.propietario!.aliasCbu!, 'propietario-alias')}
                    className="h-8 w-8 p-0"
                  >
                    {copied === 'propietario-alias' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="font-mono text-lg text-slate-900 dark:text-white">
                  {configuracion.propietario.aliasCbu}
                </p>
              </div>
            )}

            {configuracion.propietario.banco && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">Banco:</span>
                <p className="text-slate-900 dark:text-white mt-1">{configuracion.propietario.banco}</p>
              </div>
            )}

            {configuracion.propietario.qrCode && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                <span className="font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Código QR:
                </span>
                <img 
                  src={`data:image/png;base64,${configuracion.propietario.qrCode}`} 
                  alt="QR Code para transferencia al propietario"
                  className="mx-auto w-48 h-48 border border-slate-300 rounded-lg"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Escanea este código QR con tu app bancaria
                </p>
              </div>
            )}

            {/* Subida de comprobante del propietario */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Comprobante de Pago al Propietario
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('propietario', e)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {comprobantePropietario && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {comprobantePropietario.name} seleccionado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuración de Pago a la Inmobiliaria */}
      {configuracion.inmobiliaria && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Pago a la Inmobiliaria (Comisión)
            </CardTitle>
            <CardDescription>
              Realiza la transferencia de la comisión a estos datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">CBU:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(configuracion.inmobiliaria!.cbuDestino, 'inmobiliaria-cbu')}
                  className="h-8 w-8 p-0"
                >
                  {copied === 'inmobiliaria-cbu' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="font-mono text-lg text-slate-900 dark:text-white break-all">
                {configuracion.inmobiliaria.cbuDestino}
              </p>
            </div>

            {configuracion.inmobiliaria.aliasCbu && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Alias:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(configuracion.inmobiliaria!.aliasCbu!, 'inmobiliaria-alias')}
                    className="h-8 w-8 p-0"
                  >
                    {copied === 'inmobiliaria-alias' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="font-mono text-lg text-slate-900 dark:text-white">
                  {configuracion.inmobiliaria.aliasCbu}
                </p>
              </div>
            )}

            {configuracion.inmobiliaria.banco && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <span className="font-medium text-slate-700 dark:text-slate-300">Banco:</span>
                <p className="text-slate-900 dark:text-white mt-1">{configuracion.inmobiliaria.banco}</p>
              </div>
            )}

            {configuracion.inmobiliaria.qrCode && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                <span className="font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Código QR:
                </span>
                <img 
                  src={`data:image/png;base64,${configuracion.inmobiliaria.qrCode}`} 
                  alt="QR Code para transferencia a la inmobiliaria"
                  className="mx-auto w-48 h-48 border border-slate-300 rounded-lg"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Escanea este código QR con tu app bancaria
                </p>
              </div>
            )}

            {/* Subida de comprobante de la inmobiliaria */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Comprobante de Pago a la Inmobiliaria
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('inmobiliaria', e)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {comprobanteInmobiliaria && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {comprobanteInmobiliaria.name} seleccionado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones generales */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
          Instrucciones:
        </h4>
        <ol className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>1. Realiza las transferencias a los CBU indicados</li>
          <li>2. <strong>Sube AMBOS comprobantes:</strong> uno para el propietario y otro para la inmobiliaria</li>
          <li>3. Completa los datos del formulario de pago</li>
          <li>4. Espera la verificación del administrador</li>
        </ol>
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Importante:</strong> Debes subir los comprobantes de ambas transferencias para que el pago sea procesado correctamente.
          </p>
        </div>
      </div>
    </div>
  );
};
