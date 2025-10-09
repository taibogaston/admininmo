-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "inmobiliariaId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inmobiliariaId" TEXT;

-- CreateTable
CREATE TABLE "Inmobiliaria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inmobiliaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inmobiliaria_slug_key" ON "Inmobiliaria"("slug");

-- CreateIndex
CREATE INDEX "Contrato_inmobiliariaId_idx" ON "Contrato"("inmobiliariaId");

-- CreateIndex
CREATE INDEX "User_inmobiliariaId_idx" ON "User"("inmobiliariaId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
