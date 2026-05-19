/*
  Warnings:

  - A unique constraint covering the columns `[fioId]` on the table `Factura` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Factura" DROP CONSTRAINT "Factura_ventaId_fkey";

-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "fioId" INTEGER,
ALTER COLUMN "ventaId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Factura_fioId_key" ON "Factura"("fioId");

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_fioId_fkey" FOREIGN KEY ("fioId") REFERENCES "Fio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
