-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROPIETARIO', 'INQUILINO');

-- CreateEnum
CREATE TYPE "ContratoEstado" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "PagoEstado" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "PagoMetodo" AS ENUM ('MP', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "MovimientoTipo" AS ENUM ('CARGO', 'PAGO');

-- CreateEnum
CREATE TYPE "TransferenciaEstado" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "dni" TEXT,
    "cuitCuil" TEXT,
    "rol" "UserRole" NOT NULL,
    "cbu" TEXT,
    "banco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "propietarioId" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "montoMensual" DECIMAL(12,2) NOT NULL,
    "diaVencimiento" INTEGER NOT NULL DEFAULT 10,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "ContratoEstado" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoArchivo" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratoArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "comision" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" "PagoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "metodoPago" "PagoMetodo",
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tipo" "MovimientoTipo" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagoId" TEXT,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "comprobantePath" TEXT NOT NULL,
    "verificado" "TransferenciaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "verificadoPorId" TEXT,
    "verificadoAt" TIMESTAMP(3),
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Contrato_propietarioId_idx" ON "Contrato"("propietarioId");

-- CreateIndex
CREATE INDEX "Contrato_inquilinoId_idx" ON "Contrato"("inquilinoId");

-- CreateIndex
CREATE INDEX "Contrato_estado_idx" ON "Contrato"("estado");

-- CreateIndex
CREATE INDEX "ContratoArchivo_contratoId_idx" ON "ContratoArchivo"("contratoId");

-- CreateIndex
CREATE INDEX "Pago_contratoId_idx" ON "Pago"("contratoId");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_contratoId_mes_key" ON "Pago"("contratoId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "Movimiento_pagoId_key" ON "Movimiento"("pagoId");

-- CreateIndex
CREATE INDEX "Movimiento_contratoId_idx" ON "Movimiento"("contratoId");

-- CreateIndex
CREATE INDEX "Movimiento_fecha_idx" ON "Movimiento"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Transferencia_pagoId_key" ON "Transferencia"("pagoId");

-- CreateIndex
CREATE INDEX "Transferencia_verificado_idx" ON "Transferencia"("verificado");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoArchivo" ADD CONSTRAINT "ContratoArchivo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_verificadoPorId_fkey" FOREIGN KEY ("verificadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
