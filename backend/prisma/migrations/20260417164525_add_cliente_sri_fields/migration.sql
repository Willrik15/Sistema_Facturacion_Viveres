-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "tipoIdentificacion" TEXT NOT NULL DEFAULT 'CEDULA',
ALTER COLUMN "telefono" DROP NOT NULL;
