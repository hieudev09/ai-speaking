import { Module } from '@nestjs/common';
import { AIRouterService } from './router/ai-router.service.js';
import { OpenAIProviderService } from './providers/openai.provider.js';
import { ClaudeProviderService } from './providers/claude.provider.js';
import { GeminiProviderService } from './providers/gemini.provider.js';
import { CostTrackerService } from './cost/cost-tracker.service.js';

@Module({
  providers: [
    AIRouterService,
    OpenAIProviderService,
    ClaudeProviderService,
    GeminiProviderService,
    CostTrackerService,
  ],
  exports: [
    AIRouterService,
    OpenAIProviderService,
    ClaudeProviderService,
    GeminiProviderService,
    CostTrackerService,
  ],
})
export class GatewayModule {}
