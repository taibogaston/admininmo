"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardTitle } from "@/components/ui/card";

export const AjusteCalculator = () => {
  const [metodo, setMetodo] = useState("ICL");
  const [montoBase, setMontoBase] = useState("0");
  const [meses, setMeses] = useState("12");
  const [tasaMensual, setTasaMensual] = useState("0.02");
  const [indices, setIndices] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);

  const calcular = async () => {
    const params = new URLSearchParams({
      metodo,
      montoBase,
    });
    if (meses) params.append("meses", meses);
    if (tasaMensual) params.append("tasaMensual", tasaMensual);
    if (indices) params.append("indices", indices);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/api/ajustes/calcular?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setResultado("No se pudo calcular");
      return;
    }
    const data = await res.json();
    setResultado(`Monto ajustado: ${data.montoAjustado.toFixed?.(2) ?? data.montoAjustado}`);
  };

  return (
    <Card className="space-y-3">
      <CardTitle>Calculadora ICL/IPC</CardTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Método</Label>
          <Select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="ICL">ICL</option>
            <option value="IPC">IPC</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Monto base</Label>
          <Input type="number" value={montoBase} onChange={(e) => setMontoBase(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Meses</Label>
          <Input type="number" value={meses} onChange={(e) => setMeses(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tasa mensual (decimal)</Label>
          <Input type="number" step="0.001" value={tasaMensual} onChange={(e) => setTasaMensual(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Índices (opcional, separados por coma)</Label>
          <Input value={indices} onChange={(e) => setIndices(e.target.value)} />
        </div>
      </div>
      <Button onClick={calcular}>Calcular</Button>
      {resultado && <p className="text-sm text-slate-700">{resultado}</p>}
    </Card>
  );
};
