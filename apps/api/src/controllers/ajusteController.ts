import { Request, Response } from "express";
import { z } from "zod";
import { calcularAjuste } from "../utils/ajustes";
import { AjusteMetodo } from "@admin-inmo/shared";

const ajusteQuerySchema = z.object({
  metodo: z.enum(["ICL", "IPC"]),
  montoBase: z.coerce.number().positive(),
  meses: z.coerce.number().positive().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  tasaMensual: z.coerce.number().nonnegative().optional(),
  indices: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n)) : undefined)),
});

export const calcularAjusteController = (req: Request, res: Response) => {
  const parsed = ajusteQuerySchema.parse(req.query);
  const result = calcularAjuste({
    metodo: parsed.metodo as AjusteMetodo,
    montoBase: parsed.montoBase,
    meses: parsed.meses,
    desde: parsed.desde,
    hasta: parsed.hasta,
    tasaMensual: parsed.tasaMensual,
    indices: parsed.indices,
  });
  res.json(result);
};
