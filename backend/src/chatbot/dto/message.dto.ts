import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChatbotMessageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  mensaje!: string;

  usuarioId?: number;
}

export class ChatbotResponseDto {
  respuesta!: string;
  tipo!:
    | 'PRODUCTO'
    | 'PRECIO'
    | 'STOCK'
    | 'CLIENTE'
    | 'DEUDA'
    | 'GENERAL'
    | 'ERROR'
    | 'SALUDO'
    | 'AYUDA'
    | 'DESCONOCIDO';
  datos?: any;
  timestamp!: Date;
}
