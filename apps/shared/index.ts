export enum UserRole {
  ADMIN = "ADMIN",
  PROPIETARIO = "PROPIETARIO",
  INQUILINO = "INQUILINO",
}

export enum ContratoEstado {
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
}

export enum PagoEstado {
  PENDIENTE = "PENDIENTE",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
}

export enum PagoMetodo {
  MP = "MP",
  TRANSFERENCIA = "TRANSFERENCIA",
}

export enum MovimientoTipo {
  CARGO = "CARGO",
  PAGO = "PAGO",
}

export enum TransferenciaEstado {
  PENDIENTE = "PENDIENTE",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
}

export enum DescuentoEstado {
  PENDIENTE = "PENDIENTE",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
}

export const JWT_COOKIE_NAME = "rentapp.token";

export type AuthTokenPayload = {
  id: string;
  email: string;
  role: UserRole;
};

export type AjusteMetodo = "ICL" | "IPC";

export interface AjusteRequest {
  metodo: AjusteMetodo;
  montoBase: number;
  meses?: number;
  desde?: string;
  hasta?: string;
  tasaMensual?: number;
  indices?: number[];
}

export interface AjusteResponse {
  metodo: AjusteMetodo;
  montoBase: number;
  montoAjustado: number;
  detalle: string;
}
