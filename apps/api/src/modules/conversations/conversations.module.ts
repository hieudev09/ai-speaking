import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service.js';
import { ConversationsController } from './conversations.controller.js';
import { AiModule } from '../ai/ai.module.js';
import { RagModule } from '../rag/rag.module.js';
import { GamificationModule } from '../gamification/gamification.module.js';

@Module({
  imports: [AiModule, RagModule, GamificationModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
