import {
  UserRole,
  ContratoEstado,
  PagoEstado,
  PagoMetodo,
  MovimientoTipo,
  TransferenciaEstado,
  DescuentoEstado,
  InmobiliariaSummary,
} from "@admin-inmo/shared";

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  dni?: string | null;
  mustChangePassword?: boolean;
  inmobiliariaId: string | null;
  inmobiliaria?: InmobiliariaSummary | null;
}

export interface ContratoArchivo {
  id: string;
  contratoId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  uploadedAt: string;
}

export interface Pago {
  id: string;
  contratoId: string;
  mes: string;
  monto: string;
  estado: PagoEstado;
  fechaPago?: string;
  metodoPago?: PagoMetodo;
}

export interface Movimiento {
  id: string;
  contratoId: string;
  tipo: MovimientoTipo;
  concepto: string;
  monto: string;
  fecha: string;
}

export interface Descuento {
  id: string;
  contratoId: string;
  inquilinoId: string;
  monto: string;
  motivo: string;
  estado: DescuentoEstado;
  createdAt: string;
  updatedAt: string;
}

export interface Contrato {
  id: string;
  inmobiliariaId: string;
  direccion: string;
  montoMensual: string;
  comisionMensual: string;
  diaVencimiento: number;
  fechaInicio: string;
  fechaFin: string;
  fechaUltimoAjuste: string;
  ajusteFrecuenciaMeses: number;
  estado: ContratoEstado;
  propietarioId: string;
  inquilinoId: string;
  propietario?: User;
  inquilino?: User;
  pagos?: Pago[];
  descuentos?: Descuento[];
}

export interface Transferencia {
  id: string;
  pagoId: string;
  comprobantePath: string;
  verificado: TransferenciaEstado;
  comentario?: string;
  pago: Pago & {
    contrato: Contrato & {
      propietario: User;
      inquilino: User;
    };
  };
  createdAt: string;
}

export interface DescuentoDetalle extends Descuento {
  contrato: Contrato & {
    propietario?: User;
    inquilino?: User;
  };
}

export type Inmobiliaria = InmobiliariaSummary;

export interface InmobiliariaWithCounts extends InmobiliariaSummary {
  usuarios: number;
  contratos: number;
}



