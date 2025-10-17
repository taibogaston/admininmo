"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clientApiFetch } from "@/lib/client-api";
import { toast } from "@/lib/toast";

interface ConfiguracionPagosDualFormProps {
  inmobiliariaId: string;
  readonly?: boolean;
}

interface ConfiguracionPagos {
  cbuDestino: string;
  aliasCbu?: string;
  banco?: string;
  qrCode?: string;
  activo: boolean;
}

interface ConfiguracionPagosResponse {
  inmobiliaria: ConfiguracionPagos | null;
  propietario: ConfiguracionPagos | null;
  porcentajeComision: number;
}

export const ConfiguracionPagosDualForm = ({ inmobiliariaId, readonly = false }: ConfiguracionPagosDualFormProps) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionPagosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInmobiliaria, setSavingInmobiliaria] = useState(false);
  const [savingPropietario, setSavingPropietario] = useState(false);
  
  const [formDataInmobiliaria, setFormDataInmobiliaria] = useState<ConfiguracionPagos>({
    cbuDestino: "",
    aliasCbu: "",
    banco: "",
    qrCode: "",
    activo: true,
  });

  const [formDataPropietario, setFormDataPropietario] = useState<ConfiguracionPagos>({
    cbuDestino: "",
    aliasCbu: "",
    banco: "",
    qrCode: "",
    activo: true,
  });

  useEffect(() => {
    loadConfiguracion();
  }, [inmobiliariaId]);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/${inmobiliariaId}`) as ConfiguracionPagosResponse;
      if (response) {
        setConfiguracion(response);
        
        // Cargar datos de inmobiliaria
        if (response.inmobiliaria) {
          setFormDataInmobiliaria({
            cbuDestino: response.inmobiliaria.cbuDestino || "",
            aliasCbu: response.inmobiliaria.aliasCbu || "",
            banco: response.inmobiliaria.banco || "",
            qrCode: response.inmobiliaria.qrCode || "",
            activo: response.inmobiliaria.activo,
          });
        }

        // Cargar datos de propietario
        if (response.propietario) {
          setFormDataPropietario({
            cbuDestino: response.propietario.cbuDestino || "",
            aliasCbu: response.propietario.aliasCbu || "",
            banco: response.propietario.banco || "",
            qrCode: response.propietario.qrCode || "",
            activo: response.propietario.activo,
          });
        }
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
      // Si no existe configuración, no mostrar error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInmobiliaria = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDataInmobiliaria.cbuDestino.trim()) {
      toast.error("El CBU de destino es obligatorio para la inmobiliaria");
      return;
    }

    try {
      setSavingInmobiliaria(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/${inmobiliariaId}/inmobiliaria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataInmobiliaria),
      });
      
      toast.success("Configuración de inmobiliaria guardada exitosamente");
      await loadConfiguracion(); // Recargar para obtener los datos actualizados
    } catch (error) {
      console.error("Error guardando configuración de inmobiliaria:", error);
      toast.error("Error al guardar la configuración de inmobiliaria");
    } finally {
      setSavingInmobiliaria(false);
    }
  };

  const handleSubmitPropietario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDataPropietario.cbuDestino.trim()) {
      toast.error("El CBU de destino es obligatorio para el propietario");
      return;
    }

    try {
      setSavingPropietario(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/${inmobiliariaId}/propietario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataPropietario),
      });
      
      toast.success("Configuración de propietario guardada exitosamente");
      await loadConfiguracion(); // Recargar para obtener los datos actualizados
    } catch (error) {
      console.error("Error guardando configuración de propietario:", error);
      toast.error("Error al guardar la configuración de propietario");
    } finally {
      setSavingPropietario(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean, type: 'inmobiliaria' | 'propietario') => {
    if (type === 'inmobiliaria') {
      setFormDataInmobiliaria(prev => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setFormDataPropietario(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Configuración de Pagos Manuales
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Configura los CBU y QR donde los inquilinos realizarán las transferencias separadas
        </p>
      </div>

      {/* Configuración para Inmobiliaria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pago a Inmobiliaria (Comisión)</CardTitle>
          <CardDescription>
            Configuración para el pago de la comisión de la inmobiliaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitInmobiliaria} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cbuDestinoInmobiliaria">
                  CBU de Destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cbuDestinoInmobiliaria"
                  type="text"
                  value={formDataInmobiliaria.cbuDestino}
                  onChange={(e) => handleInputChange("cbuDestino", e.target.value, 'inmobiliaria')}
                  placeholder="Ej: 0070001234567890123456"
                  maxLength={22}
                  required
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500">
                  CBU donde se transferirá la comisión de la inmobiliaria
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasCbuInmobiliaria">Alias CBU</Label>
                <Input
                  id="aliasCbuInmobiliaria"
                  type="text"
                  value={formDataInmobiliaria.aliasCbu}
                  onChange={(e) => handleInputChange("aliasCbu", e.target.value, 'inmobiliaria')}
                  placeholder="Ej: inmobiliaria.com"
                  maxLength={50}
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500">
                  Alias del CBU (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bancoInmobiliaria">Banco</Label>
                <Input
                  id="bancoInmobiliaria"
                  type="text"
                  value={formDataInmobiliaria.banco}
                  onChange={(e) => handleInputChange("banco", e.target.value, 'inmobiliaria')}
                  placeholder="Ej: Banco Nación"
                  maxLength={100}
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500">
                  Nombre del banco (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activoInmobiliaria">Estado</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="activoInmobiliaria"
                    type="checkbox"
                    checked={formDataInmobiliaria.activo}
                    onChange={(e) => handleInputChange("activo", e.target.checked, 'inmobiliaria')}
                    className="rounded border-slate-300"
                    disabled={readonly}
                  />
                  <Label htmlFor="activoInmobiliaria" className="text-sm">
                    Configuración activa
                  </Label>
                </div>
                <p className="text-sm text-slate-500">
                  Solo los inquilinos pueden ver configuraciones activas
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrCodeInmobiliaria">Código QR (Base64)</Label>
              <Textarea
                id="qrCodeInmobiliaria"
                value={formDataInmobiliaria.qrCode}
                onChange={(e) => handleInputChange("qrCode", e.target.value, 'inmobiliaria')}
                placeholder="Pega aquí el código QR en formato Base64..."
                rows={4}
                readOnly={readonly}
              />
              <p className="text-sm text-slate-500">
                Código QR generado con los datos del CBU (opcional)
              </p>
            </div>

            {!readonly && (
              <div className="flex justify-end">
                <Button type="submit" disabled={savingInmobiliaria}>
                  {savingInmobiliaria ? "Guardando..." : "Guardar Configuración Inmobiliaria"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Configuración para Propietario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pago a Propietario (Alquiler)</CardTitle>
          <CardDescription>
            Configuración para el pago del alquiler al propietario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPropietario} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cbuDestinoPropietario">
                  CBU de Destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cbuDestinoPropietario"
                  type="text"
                  value={formDataPropietario.cbuDestino}
                  onChange={(e) => handleInputChange("cbuDestino", e.target.value, 'propietario')}
                  placeholder="Ej: 0070001234567890123456"
                  maxLength={22}
                  required
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500">
                  CBU donde se transferirá el alquiler al propietario
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasCbuPropietario">Alias CBU</Label>
                <Input
                  id="aliasCbuPropietario"
                  type="text"
                  value={formDataPropietario.aliasCbu}
                  onChange={(e) => handleInputChange("aliasCbu", e.target.value, 'propietario')}
                  placeholder="Ej: propietario.casa"
                  maxLength={50}
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500">
                  Alias del CBU (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bancoPropietario">Banco</Label>
                <Input
                  id="bancoPropietario"
                  type="text"
                  value={formDataPropietario.banco}
                  onChange={(e) => handleInputChange("banco", e.target.value, 'propietario')}
                  placeholder="Ej: Banco Nación"
                  maxLength={100}
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500">
                  Nombre del banco (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activoPropietario">Estado</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="activoPropietario"
                    type="checkbox"
                    checked={formDataPropietario.activo}
                    onChange={(e) => handleInputChange("activo", e.target.checked, 'propietario')}
                    className="rounded border-slate-300"
                    disabled={readonly}
                  />
                  <Label htmlFor="activoPropietario" className="text-sm">
                    Configuración activa
                  </Label>
                </div>
                <p className="text-sm text-slate-500">
                  Solo los inquilinos pueden ver configuraciones activas
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrCodePropietario">Código QR (Base64)</Label>
              <Textarea
                id="qrCodePropietario"
                value={formDataPropietario.qrCode}
                onChange={(e) => handleInputChange("qrCode", e.target.value, 'propietario')}
                placeholder="Pega aquí el código QR en formato Base64..."
                rows={4}
                readOnly={readonly}
              />
              <p className="text-sm text-slate-500">
                Código QR generado con los datos del CBU (opcional)
              </p>
            </div>

            {!readonly && (
              <div className="flex justify-end">
                <Button type="submit" disabled={savingPropietario}>
                  {savingPropietario ? "Guardando..." : "Guardar Configuración Propietario"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Vista Previa para Inquilinos */}
      {(configuracion?.inmobiliaria || configuracion?.propietario) && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa para Inquilinos</CardTitle>
            <CardDescription>
              Así verán los datos los inquilinos al realizar pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vista de Inmobiliaria */}
              {configuracion.inmobiliaria && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Pago a Inmobiliaria</h4>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">CBU:</span>
                    <span className="ml-2 font-mono text-slate-900 dark:text-white">
                      {formDataInmobiliaria.cbuDestino}
                    </span>
                  </div>
                  {formDataInmobiliaria.aliasCbu && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Alias:</span>
                      <span className="ml-2 text-slate-900 dark:text-white">{formDataInmobiliaria.aliasCbu}</span>
                    </div>
                  )}
                  {formDataInmobiliaria.banco && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Banco:</span>
                      <span className="ml-2 text-slate-900 dark:text-white">{formDataInmobiliaria.banco}</span>
                    </div>
                  )}
                  {formDataInmobiliaria.qrCode && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">QR:</span>
                      <div className="mt-2">
                        <img 
                          src={`data:image/png;base64,${formDataInmobiliaria.qrCode}`} 
                          alt="QR Code Inmobiliaria" 
                          className="w-32 h-32 border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vista de Propietario */}
              {configuracion.propietario && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Pago a Propietario</h4>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">CBU:</span>
                    <span className="ml-2 font-mono text-slate-900 dark:text-white">
                      {formDataPropietario.cbuDestino}
                    </span>
                  </div>
                  {formDataPropietario.aliasCbu && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Alias:</span>
                      <span className="ml-2 text-slate-900 dark:text-white">{formDataPropietario.aliasCbu}</span>
                    </div>
                  )}
                  {formDataPropietario.banco && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Banco:</span>
                      <span className="ml-2 text-slate-900 dark:text-white">{formDataPropietario.banco}</span>
                    </div>
                  )}
                  {formDataPropietario.qrCode && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">QR:</span>
                      <div className="mt-2">
                        <img 
                          src={`data:image/png;base64,${formDataPropietario.qrCode}`} 
                          alt="QR Code Propietario" 
                          className="w-32 h-32 border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
