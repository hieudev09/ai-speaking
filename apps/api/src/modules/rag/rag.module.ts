import { Module } from '@nestjs/common';
import { RagService } from './rag.service.js';
import { RagController } from './rag.controller.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [AiModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
