import {
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

class DetalleFioDto {
  @IsInt()
  productoId!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsNumber()
  @IsPositive()
  precio!: number;
}

export class CreateFioDto {
  @IsInt()
  clienteId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleFioDto)
  detalles!: DetalleFioDto[];
}
