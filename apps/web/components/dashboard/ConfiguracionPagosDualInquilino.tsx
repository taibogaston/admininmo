"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/client-api";
import { Copy, Check, QrCode, Upload, User, Building, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface ConfiguracionPagosDualInquilinoProps {
  inmobiliariaId: string;
  onComprobanteChange: (tipo: 'propietario' | 'inmobiliaria', file: File | null) => void;
  comprobantePropietario: File | null;
  comprobanteInmobiliaria: File | null;
  onSubmitComprobante: (tipo: 'propietario' | 'inmobiliaria') => Promise<void>;
  isSubmitting: boolean;
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
  comprobanteInmobiliaria,
  onSubmitComprobante,
  isSubmitting
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
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tipo);
      toast.success("¡Copiado al portapapeles!");
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
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    );
  }

  if (!configuracion || (!configuracion.inmobiliaria && !configuracion.propietario)) {
    return null;
  }

  const propietarioCompleto = comprobantePropietario !== null;
  const inmobiliariaCompleto = comprobanteInmobiliaria !== null;

  return (
    <div className="space-y-6">
      {/* Header con Instrucciones */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                ¿Cómo realizar el pago?
              </h3>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">1</span>
                  <span>Realiza <strong>dos transferencias</strong> a los CBU que se muestran abajo</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">2</span>
                  <span>Sube <strong>ambos comprobantes</strong> (uno por cada transferencia)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">3</span>
                  <span>Haz clic en <strong>"Enviar datos de transferencia"</strong> al final de la página</span>
                </p>
              </div>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Importante:</strong> Necesitas subir los comprobantes de ambas transferencias para completar el pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 columnas para las transferencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transferencia al Propietario */}
        {configuracion.propietario && (
        <Card className={`relative overflow-hidden transition-all duration-300 ${propietarioCompleto ? 'ring-2 ring-green-500 dark:ring-green-600' : 'hover:shadow-lg'}`}>
          {propietarioCompleto && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                Comprobante Listo
              </div>
            </div>
          )}
          
          <CardContent className="p-0">
            {/* Header de la Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-6 py-5 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 text-white shadow-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Transferencia 1: Propietario
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Esta es la transferencia del alquiler
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* CBU - Destacado */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  CBU del Propietario
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-lg font-bold text-slate-900 dark:text-white break-all">
                        {configuracion.propietario.cbuDestino}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(configuracion.propietario!.cbuDestino, 'propietario-cbu')}
                      className="ml-3 h-10 w-10 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      {copied === 'propietario-cbu' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-blue-600" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alias si existe */}
              {configuracion.propietario.aliasCbu && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    O también puedes usar el Alias
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="font-mono text-base font-semibold text-slate-900 dark:text-white">
                      {configuracion.propietario.aliasCbu}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(configuracion.propietario!.aliasCbu!, 'propietario-alias')}
                      className="h-8 w-8 p-0"
                    >
                      {copied === 'propietario-alias' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Banco */}
              {configuracion.propietario.banco && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Banco:
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {configuracion.propietario.banco}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {configuracion.propietario.qrCode && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <QrCode className="w-4 h-4" />
                      O escanea este código QR
                    </div>
                    <img 
                      src={`data:image/png;base64,${configuracion.propietario.qrCode}`} 
                      alt="QR Code para transferencia al propietario"
                      className="mx-auto w-56 h-56 border-4 border-white dark:border-slate-700 rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Subida de Comprobante */}
              <div className={`rounded-xl border-2 border-dashed p-6 transition-all duration-300 ${
                propietarioCompleto 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:border-blue-400'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {propietarioCompleto ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-blue-600" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${propietarioCompleto ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                        {propietarioCompleto ? '✓ Comprobante cargado' : 'Sube el comprobante del propietario'}
                      </h4>
                      <p className={`text-sm ${propietarioCompleto ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                        {propietarioCompleto ? comprobantePropietario?.name : 'Foto o PDF del comprobante de transferencia'}
                      </p>
                    </div>
                  </div>
                  
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange('propietario', e)}
                      className="block w-full text-sm text-slate-600 dark:text-slate-400
                        file:mr-4 file:py-3 file:px-6
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700
                        file:cursor-pointer file:transition-all
                        cursor-pointer"
                    />
                  </label>

                  {/* Botón de envío */}
                  {propietarioCompleto && (
                    <Button
                      type="button"
                      onClick={() => onSubmitComprobante('propietario')}
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Comprobante del Propietario'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Transferencia a la Inmobiliaria */}
        {configuracion.inmobiliaria && (
        <Card className={`relative overflow-hidden transition-all duration-300 ${inmobiliariaCompleto ? 'ring-2 ring-green-500 dark:ring-green-600' : 'hover:shadow-lg'}`}>
          {inmobiliariaCompleto && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                Comprobante Listo
              </div>
            </div>
          )}
          
          <CardContent className="p-0">
            {/* Header de la Card */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 px-6 py-5 border-b border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 text-white shadow-lg">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Transferencia 2: Inmobiliaria
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Esta es la transferencia de la comisión
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* CBU - Destacado */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  CBU de la Inmobiliaria
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-lg font-bold text-slate-900 dark:text-white break-all">
                        {configuracion.inmobiliaria.cbuDestino}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(configuracion.inmobiliaria!.cbuDestino, 'inmobiliaria-cbu')}
                      className="ml-3 h-10 w-10 p-0 hover:bg-purple-100 dark:hover:bg-purple-900"
                    >
                      {copied === 'inmobiliaria-cbu' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-purple-600" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Alias si existe */}
              {configuracion.inmobiliaria.aliasCbu && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    O también puedes usar el Alias
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="font-mono text-base font-semibold text-slate-900 dark:text-white">
                      {configuracion.inmobiliaria.aliasCbu}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(configuracion.inmobiliaria!.aliasCbu!, 'inmobiliaria-alias')}
                      className="h-8 w-8 p-0"
                    >
                      {copied === 'inmobiliaria-alias' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Banco */}
              {configuracion.inmobiliaria.banco && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Banco:
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {configuracion.inmobiliaria.banco}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {configuracion.inmobiliaria.qrCode && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <QrCode className="w-4 h-4" />
                      O escanea este código QR
                    </div>
                    <img 
                      src={`data:image/png;base64,${configuracion.inmobiliaria.qrCode}`} 
                      alt="QR Code para transferencia a la inmobiliaria"
                      className="mx-auto w-56 h-56 border-4 border-white dark:border-slate-700 rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Subida de Comprobante */}
              <div className={`rounded-xl border-2 border-dashed p-6 transition-all duration-300 ${
                inmobiliariaCompleto 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600' 
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 hover:border-purple-400'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {inmobiliariaCompleto ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-purple-600" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${inmobiliariaCompleto ? 'text-green-800 dark:text-green-200' : 'text-purple-800 dark:text-purple-200'}`}>
                        {inmobiliariaCompleto ? '✓ Comprobante cargado' : 'Sube el comprobante de la inmobiliaria'}
                      </h4>
                      <p className={`text-sm ${inmobiliariaCompleto ? 'text-green-700 dark:text-green-300' : 'text-purple-700 dark:text-purple-300'}`}>
                        {inmobiliariaCompleto ? comprobanteInmobiliaria?.name : 'Foto o PDF del comprobante de transferencia'}
                      </p>
                    </div>
                  </div>
                  
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange('inmobiliaria', e)}
                      className="block w-full text-sm text-slate-600 dark:text-slate-400
                        file:mr-4 file:py-3 file:px-6
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-purple-600 file:text-white
                        hover:file:bg-purple-700
                        file:cursor-pointer file:transition-all
                        cursor-pointer"
                    />
                  </label>

                  {/* Botón de envío */}
                  {inmobiliariaCompleto && (
                    <Button
                      type="button"
                      onClick={() => onSubmitComprobante('inmobiliaria')}
                      disabled={isSubmitting}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Comprobante de la Inmobiliaria'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};
