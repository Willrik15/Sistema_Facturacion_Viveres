-- AlterTable
ALTER TABLE "InventarioMovimiento" ADD COLUMN     "refId" INTEGER,
ADD COLUMN     "referencia" TEXT,
ADD COLUMN     "saldo" INTEGER NOT NULL DEFAULT 0;
