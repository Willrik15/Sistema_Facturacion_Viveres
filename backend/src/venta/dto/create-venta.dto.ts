import { IsInt, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
// DTO para crear una venta, incluyendo el cliente, usuario y los detalles de la venta
class DetalleVentaDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;
}
// DTO para crear una venta, incluyendo el cliente, usuario y los detalles de la venta
export class CreateVentaDto {
  @IsInt()
  clienteId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalles!: DetalleVentaDto[];
}
