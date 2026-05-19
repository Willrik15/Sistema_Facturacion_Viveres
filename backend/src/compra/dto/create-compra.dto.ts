import {
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para el detalle de compra
class DetalleCompraDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsNumber()
  @IsPositive()
  costoUnitario!: number;
}
// DTO para crear una compra
export class CreateCompraDto {
  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsOptional()
  @IsInt()
  usuarioId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCompraDto)
  detalles!: DetalleCompraDto[];
}
