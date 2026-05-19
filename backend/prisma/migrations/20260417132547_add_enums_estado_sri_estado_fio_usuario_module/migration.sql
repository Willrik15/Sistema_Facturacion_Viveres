-- CreateEnum
CREATE TYPE "EstadoFio" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO');

-- CreateEnum
CREATE TYPE "EstadoSRI" AS ENUM ('GENERADA', 'AUTORIZADA', 'RECHAZADA', 'ANULADA');

-- AlterTable: Factura.estadoSRI String → EstadoSRI enum
ALTER TABLE "Factura" DROP COLUMN "estadoSRI";
ALTER TABLE "Factura" ADD COLUMN "estadoSRI" "EstadoSRI" NOT NULL DEFAULT 'GENERADA';

-- AlterTable: Fio.estado String → EstadoFio enum
ALTER TABLE "Fio" DROP COLUMN "estado";
ALTER TABLE "Fio" ADD COLUMN "estado" "EstadoFio" NOT NULL DEFAULT 'PENDIENTE';
