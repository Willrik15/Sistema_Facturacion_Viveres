import { IsString, Matches, MinLength, MaxLength } from 'class-validator';
// DTO para crear un nuevo proveedor
export class CreateProveedorDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombre!: string;

  @IsString()
  @Matches(/^[0-9]{13}$/, { message: 'RUC debe ser 13 digitos' })
  ruc!: string;

  @IsString()
  @Matches(/^[0-9]{7,10}$/, { message: 'Telefono debe ser 7-10 digitos' })
  telefono!: string;
}
