import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';
//dto para actualizar cliente
export class UpdateClienteDto extends PartialType(CreateClienteDto) {}
