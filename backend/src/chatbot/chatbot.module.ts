import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { IntentDetectionService } from './services/intent-detection.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, IntentDetectionService],
  exports: [ChatbotService, IntentDetectionService],
})
export class ChatbotModule {}
