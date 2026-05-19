import { IsOptional, IsInt, IsDateString } from 'class-validator';
// DTO para manejar las consultas de ventas con filtros de cliente, fecha y paginación
export class QueryVentaDto {
  @IsOptional()
  @IsInt()
  clienteId?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
