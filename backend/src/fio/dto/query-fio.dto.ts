import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFioDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  estado?: string; // PENDIENTE, PAGADO, PARCIAL

  @IsOptional()
  @IsString()
  orderBy?: string; // fecha, total, cliente

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
