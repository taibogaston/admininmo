/*
  Warnings:

  - Made the column `inmobiliariaId` on table `Contrato` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Contrato" DROP CONSTRAINT "Contrato_inmobiliariaId_fkey";

-- AlterTable
ALTER TABLE "Contrato" ALTER COLUMN "inmobiliariaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_inmobiliariaId_fkey" FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
