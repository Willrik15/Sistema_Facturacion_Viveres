import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
// DTO para manejar las consultas de proveedores con paginación, búsqueda y ordenamiento
export class QueryProveedorDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  orderBy?: string = 'id';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'asc';
}
