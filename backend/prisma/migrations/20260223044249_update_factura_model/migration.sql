/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Factura` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `numero` on the `Factura` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Factura" DROP COLUMN "numero",
ADD COLUMN     "numero" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");
