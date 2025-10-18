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

export interface VerificacionComprobante {
  id: string;
  tipoComprobante: string;
  verificado: boolean;
  comentario?: string;
  verificadoAt: string;
}

export interface Pago {
  id: string;
  contratoId: string;
  mes: string;
  monto: string;
  estado: PagoEstado;
  fechaPago?: string;
  metodoPago?: PagoMetodo;
  externalId: string;
  transferencia?: {
    id: string;
    verificado: TransferenciaEstado;
    comprobantePropietarioPath?: string;
    comprobanteInmobiliariaPath?: string;
    verificaciones?: VerificacionComprobante[];
  };
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
  montoTotalAlquiler: string; // Monto total que paga el inquilino
  porcentajeComisionInmobiliaria: string; // Porcentaje de comisión para la inmobiliaria (0-100)
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
  comprobantePath?: string;
  verificado: TransferenciaEstado;
  verificadoPorId?: string;
  verificadoAt?: string;
  comentario?: string;
  transferenciaPropietarioId?: string;
  transferenciaInmobiliariaId?: string;
  pago: Pago & {
    contrato: Contrato & {
      inmobiliaria: InmobiliariaSummary;
      propietario: User;
      inquilino: User;
    };
  };
  createdAt: string;
  updatedAt: string;
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
  pago: Pago & {
    contrato: Contrato & {
      inmobiliaria: InmobiliariaSummary;
      propietario: User;
      inquilino: User;
    };
  };
  createdAt: string;
  updatedAt: string;
}
