import {
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class DetalleConsumoDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class CreateConsumoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  motivo!: string;

  @IsOptional()
  @IsInt()
  usuarioId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleConsumoDto)
  detalles!: DetalleConsumoDto[];
}
