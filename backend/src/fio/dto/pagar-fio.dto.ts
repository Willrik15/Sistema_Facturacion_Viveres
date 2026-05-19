import { IsInt, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';

export class PagarFioDto {
  @IsInt()
  fioId!: number;

  @IsNumber()
  @Min(0.01)
  monto!: number;

  @IsOptional()
  @IsBoolean()
  emitirFactura?: boolean;
}
