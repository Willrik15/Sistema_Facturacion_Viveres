/*
  Warnings:

  - The `estado` column on the `Compra` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `numero` on the `Factura` table. All the data in the column will be lost.
  - Changed the type of `tipo` on the `InventarioMovimiento` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('ACTIVA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('ACTIVA', 'ANULADA');

-- DropIndex
DROP INDEX "Factura_numero_key";

-- AlterTable
ALTER TABLE "Compra" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoCompra" NOT NULL DEFAULT 'ACTIVA';

-- AlterTable
ALTER TABLE "Factura" DROP COLUMN "numero";

-- AlterTable
ALTER TABLE "InventarioMovimiento" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoMovimiento" NOT NULL;

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "estado" "EstadoVenta" NOT NULL DEFAULT 'ACTIVA';
