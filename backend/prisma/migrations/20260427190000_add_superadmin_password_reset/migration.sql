ALTER TYPE "RolUsuario" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

ALTER TABLE "Usuario"
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Usuario_resetPasswordToken_key" ON "Usuario"("resetPasswordToken");
