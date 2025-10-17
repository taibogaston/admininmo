"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clientApiFetch } from "@/lib/client-api";
import { toast } from "@/lib/toast";
import { ConfiguracionPagos } from "@admin-inmo/shared";

interface ConfiguracionPagosFormProps {
  inmobiliariaId: string;
  initialData?: ConfiguracionPagos;
  readonly?: boolean;
}

export const ConfiguracionPagosForm = ({ inmobiliariaId, initialData, readonly = false }: ConfiguracionPagosFormProps) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionPagos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    cbuDestino: "",
    aliasCbu: "",
    banco: "",
    qrCode: "",
    activo: true,
    porcentajeComision: 3.0,
  });

  useEffect(() => {
    if (initialData) {
      setConfiguracion(initialData);
      setFormData({
        cbuDestino: initialData.cbuDestino || "",
        aliasCbu: initialData.aliasCbu || "",
        banco: initialData.banco || "",
        qrCode: initialData.qrCode || "",
        activo: initialData.activo,
        porcentajeComision: (initialData as any).porcentajeComision || 3.0,
      });
      setLoading(false);
    } else {
      loadConfiguracion();
    }
  }, [inmobiliariaId, initialData]);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/${inmobiliariaId}`);
      if (response) {
        setConfiguracion(response as ConfiguracionPagos);
        setFormData({
          cbuDestino: (response as ConfiguracionPagos).cbuDestino || "",
          aliasCbu: (response as ConfiguracionPagos).aliasCbu || "",
          banco: (response as ConfiguracionPagos).banco || "",
          qrCode: (response as ConfiguracionPagos).qrCode || "",
          activo: (response as ConfiguracionPagos).activo,
          porcentajeComision: (response as any).porcentajeComision || 3.0,
        });
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
      // Si no existe configuración, no mostrar error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cbuDestino.trim()) {
      toast.error("El CBU de destino es obligatorio");
      return;
    }

    try {
      setSaving(true);
      const response = await clientApiFetch(`/api/configuracion-pagos/${inmobiliariaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      setConfiguracion(response as ConfiguracionPagos);
      toast.success("Configuración guardada exitosamente");
    } catch (error) {
      console.error("Error guardando configuración:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Configuración de Pagos Manuales
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Configura el CBU y QR donde los inquilinos realizarán las transferencias
        </p>
      </div>

      <Card className="dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Datos de Transferencia</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Esta información será visible para los inquilinos al realizar pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cbuDestino">
                  CBU de Destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cbuDestino"
                  type="text"
                  value={formData.cbuDestino}
                  onChange={(e) => handleInputChange("cbuDestino", e.target.value)}
                  placeholder="Ej: 0070001234567890123456"
                  maxLength={22}
                  required
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  CBU donde los inquilinos deben transferir el dinero
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliasCbu">Alias CBU</Label>
                <Input
                  id="aliasCbu"
                  type="text"
                  value={formData.aliasCbu}
                  onChange={(e) => handleInputChange("aliasCbu", e.target.value)}
                  placeholder="Ej: admin.inmo"
                  maxLength={50}
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Alias del CBU (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  type="text"
                  value={formData.banco}
                  onChange={(e) => handleInputChange("banco", e.target.value)}
                  placeholder="Ej: Banco Nación"
                  maxLength={100}
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nombre del banco (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porcentajeComision">Porcentaje de Comisión</Label>
                <Input
                  id="porcentajeComision"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.porcentajeComision}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 0 : parseFloat(value);
                    handleInputChange("porcentajeComision", isNaN(numValue) ? 0 : numValue);
                  }}
                  placeholder="3.0"
                  readOnly={readonly}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Porcentaje de comisión que recibe la inmobiliaria (ej: 3.0 para 3%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activo">Estado</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="activo"
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => handleInputChange("activo", e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    disabled={readonly}
                  />
                  <Label htmlFor="activo" className="text-sm">
                    Configuración activa
                  </Label>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Solo los inquilinos pueden ver configuraciones activas
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrCode">Código QR (Base64)</Label>
              <Textarea
                id="qrCode"
                value={formData.qrCode}
                onChange={(e) => handleInputChange("qrCode", e.target.value)}
                placeholder="Pega aquí el código QR en formato Base64..."
                rows={4}
                readOnly={readonly}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Código QR generado con los datos del CBU (opcional)
              </p>
            </div>

            {!readonly && (
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : configuracion ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {configuracion && (
        <Card className="dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Vista Previa para Inquilinos</CardTitle>
            <CardDescription className="dark:text-slate-400">
              Así verán los datos los inquilinos al realizar pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">CBU:</span>
                <span className="ml-2 font-mono text-slate-900 dark:text-white">
                  {formData.cbuDestino}
                </span>
              </div>
              {formData.aliasCbu && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Alias:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{formData.aliasCbu}</span>
                </div>
              )}
              {formData.banco && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Banco:</span>
                  <span className="ml-2 text-slate-900 dark:text-white">{formData.banco}</span>
                </div>
              )}
              {formData.qrCode && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">QR:</span>
                  <div className="mt-2">
                    <img 
                      src={`data:image/png;base64,${formData.qrCode}`} 
                      alt="QR Code" 
                      className="w-32 h-32 border border-slate-300 dark:border-slate-600 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
