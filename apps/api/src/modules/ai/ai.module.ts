import { Module } from '@nestjs/common';
import { PromptTemplatesService } from './prompt-templates.service.js';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';

@Module({
  controllers: [AiController],
  providers: [PromptTemplatesService, AiService],
  exports: [PromptTemplatesService, AiService],
})
export class AiModule {}
