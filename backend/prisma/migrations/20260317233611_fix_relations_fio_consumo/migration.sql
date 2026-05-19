/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Factura` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[claveAcceso]` on the table `Factura` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `claveAcceso` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estadoSRI` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `Factura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "claveAcceso" TEXT NOT NULL,
ADD COLUMN     "estadoSRI" TEXT NOT NULL,
ADD COLUMN     "numero" TEXT NOT NULL,
ADD COLUMN     "xmlAutorizado" TEXT,
ADD COLUMN     "xmlGenerado" TEXT;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "Fio" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Fio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleFio" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "fioId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,

    CONSTRAINT "DetalleFio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoFio" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DOUBLE PRECISION NOT NULL,
    "fioId" INTEGER NOT NULL,

    CONSTRAINT "PagoFio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoInterno" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "ConsumoInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleConsumo" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "consumoId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,

    CONSTRAINT "DetalleConsumo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_claveAcceso_key" ON "Factura"("claveAcceso");

-- AddForeignKey
ALTER TABLE "Fio" ADD CONSTRAINT "Fio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFio" ADD CONSTRAINT "DetalleFio_fioId_fkey" FOREIGN KEY ("fioId") REFERENCES "Fio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFio" ADD CONSTRAINT "DetalleFio_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoFio" ADD CONSTRAINT "PagoFio_fioId_fkey" FOREIGN KEY ("fioId") REFERENCES "Fio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoInterno" ADD CONSTRAINT "ConsumoInterno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleConsumo" ADD CONSTRAINT "DetalleConsumo_consumoId_fkey" FOREIGN KEY ("consumoId") REFERENCES "ConsumoInterno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleConsumo" ADD CONSTRAINT "DetalleConsumo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
