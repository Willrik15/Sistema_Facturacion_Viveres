import { PartialType } from '@nestjs/mapped-types';
import { CreateFioDto } from './create-fio.dto';

export class UpdateFioDto extends PartialType(CreateFioDto) {}
