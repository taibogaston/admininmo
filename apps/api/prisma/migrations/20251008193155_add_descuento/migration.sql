-- CreateEnum
CREATE TYPE "DescuentoEstado" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "ajusteFrecuenciaMeses" INTEGER NOT NULL DEFAULT 12;

-- CreateTable
CREATE TABLE "Descuento" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "DescuentoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Descuento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Descuento_contratoId_idx" ON "Descuento"("contratoId");

-- CreateIndex
CREATE INDEX "Descuento_estado_idx" ON "Descuento"("estado");

-- AddForeignKey
ALTER TABLE "Descuento" ADD CONSTRAINT "Descuento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Descuento" ADD CONSTRAINT "Descuento_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
