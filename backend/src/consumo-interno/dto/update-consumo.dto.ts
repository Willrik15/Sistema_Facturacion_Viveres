import { PartialType } from '@nestjs/mapped-types';
import { CreateConsumoDto } from './create-consumo.dto';

export class UpdateConsumoDto extends PartialType(CreateConsumoDto) {}
