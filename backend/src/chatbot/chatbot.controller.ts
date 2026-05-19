import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto, ChatbotResponseDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('mensaje')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  async enviarMensaje(
    @Body() dto: ChatbotMessageDto,
  ): Promise<ChatbotResponseDto> {
    return this.chatbotService.procesarMensaje(dto);
  }

  @Get('estadisticas')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  async obtenerEstadisticas() {
    return this.chatbotService.obtenerEstadisticas();
  }
}
