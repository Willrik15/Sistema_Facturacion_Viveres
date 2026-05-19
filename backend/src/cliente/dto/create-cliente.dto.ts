import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

const TIPOS_IDENTIFICACION = ['CEDULA', 'RUC', 'PASAPORTE', 'FINAL'] as const;

export class CreateClienteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombre!: string;

  /**
   * cedula almacena la identificación sin importar el tipo:
   * - CEDULA: 10 dígitos
   * - RUC: 13 dígitos
   * - PASAPORTE: alfanumérico 5-20 chars
   * - FINAL: fijo 9999999999999
   */
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  cedula!: string;

  @IsIn(TIPOS_IDENTIFICACION, {
    message: 'tipoIdentificacion debe ser CEDULA, RUC, PASAPORTE o FINAL',
  })
  tipoIdentificacion!: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(15)
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  direccion?: string;
}
