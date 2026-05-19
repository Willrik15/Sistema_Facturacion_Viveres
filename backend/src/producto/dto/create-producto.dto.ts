import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  MinLength,
  Matches,
  Max,
} from 'class-validator';
// DTO para crear un producto
export class CreateProductoDto {
  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsNumber()
  @IsPositive()
  precio!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  margenGanancia?: number;

  @IsInt()
  @Min(0)
  stockMinimo!: number;

  @IsInt()
  @IsOptional()
  proveedorId?: number;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{13}$/, { message: 'Codigo de barras debe ser 13 digitos' })
  codigoBarras?: string;
}
