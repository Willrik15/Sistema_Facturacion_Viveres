-- CreateEnum: RolUsuario
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'VENDEDOR', 'BODEGA');

-- Add rol column to Usuario using Rol table join
ALTER TABLE "Usuario" ADD COLUMN "rol" "RolUsuario" NOT NULL DEFAULT 'VENDEDOR';

-- Update rol from existing Rol table
UPDATE "Usuario" u
SET "rol" = CASE
  WHEN r.nombre = 'ADMIN'    THEN 'ADMIN'::"RolUsuario"
  WHEN r.nombre = 'BODEGA'   THEN 'BODEGA'::"RolUsuario"
  ELSE                            'VENDEDOR'::"RolUsuario"
END
FROM "Rol" r
WHERE u."rolId" = r.id;

-- Drop foreign key constraint
ALTER TABLE "Usuario" DROP CONSTRAINT IF EXISTS "Usuario_rolId_fkey";

-- Drop rolId column
ALTER TABLE "Usuario" DROP COLUMN "rolId";

-- Drop Rol table
DROP TABLE IF EXISTS "Rol";
