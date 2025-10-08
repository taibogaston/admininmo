import { AjusteMetodo, AjusteRequest, AjusteResponse } from "@admin-inmo/shared";

const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const buildDetalle = (metodo: AjusteMetodo, montoBase: number, montoAjustado: number, extra: string[]): string => {
  return [
    `Método: ${metodo}`,
    `Monto base: ${montoBase.toFixed(2)}`,
    `Monto ajustado: ${montoAjustado.toFixed(2)}`,
    ...extra,
  ].join(" | ");
};

export const calcularAjuste = (input: AjusteRequest): AjusteResponse => {
  const { metodo, montoBase, meses, tasaMensual, indices } = input;

  if (meses && meses < 0) {
    throw new Error("La cantidad de meses debe ser positiva");
  }

  let montoAjustado = montoBase;
  const detalleExtra: string[] = [];

  if (indices && indices.length > 0) {
    montoAjustado = indices.reduce((acc, factor) => acc * factor, montoBase);
    detalleExtra.push(`Índices aplicados: ${indices.join(", ")}`);
  } else if (typeof meses === "number" && typeof tasaMensual === "number") {
    montoAjustado = montoBase * Math.pow(1 + tasaMensual, meses);
    detalleExtra.push(`Meses: ${meses}`, `Tasa mensual: ${(tasaMensual * 100).toFixed(2)}%`);
  } else if (typeof meses === "number") {
    // Ajuste lineal simple como fallback
    const tasaEstimativa = 0.02; // 2% mensual estimado para MVP
    montoAjustado = montoBase * Math.pow(1 + tasaEstimativa, meses);
    detalleExtra.push(`Meses: ${meses}`, `Tasa estimada: ${(tasaEstimativa * 100).toFixed(2)}%`);
  } else {
    detalleExtra.push("Sin índices ni meses especificados, monto base sin cambios");
  }

  montoAjustado = roundCurrency(montoAjustado);

  return {
    metodo,
    montoBase,
    montoAjustado,
    detalle: buildDetalle(metodo, montoBase, montoAjustado, detalleExtra),
  };
};
