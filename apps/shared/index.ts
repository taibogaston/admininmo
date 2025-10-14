export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
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
  PENDIENTE_VERIFICACION = "PENDIENTE_VERIFICACION",
  VERIFICADO = "VERIFICADO",
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
  inmobiliariaId: string | null;
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

export interface InmobiliariaSummary {
  id: string;
  nombre: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracionPagos {
  id: string;
  inmobiliariaId: string;
  cbuDestino: string;
  aliasCbu?: string;
  banco?: string;
  qrCode?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracionPagosPublica {
  cbuDestino: string;
  aliasCbu?: string;
  banco?: string;
  qrCode?: string;
}

export interface TransferenciaManual {
  id: string;
  pagoId: string;
  comprobantePath?: string;
  verificado: TransferenciaEstado;
  verificadoPorId?: string;
  verificadoAt?: string;
  comentario?: string;
  transferenciaPropietarioId?: string;
  transferenciaInmobiliariaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  userId?: string;
  inmobiliariaId?: string;
  pagoId?: string;
  leida: boolean;
  enviada: boolean;
  createdAt: string;
  updatedAt: string;
}
