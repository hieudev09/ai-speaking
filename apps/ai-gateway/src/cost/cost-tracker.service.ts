import { Injectable } from '@nestjs/common';
import { calculateAiCost } from '@ai-platform/ai-sdk';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('CostTrackerService');

export interface AiRequestUsage {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

@Injectable()
export class CostTrackerService {
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    return calculateAiCost(model, promptTokens, completionTokens);
  }

  trackRequest(usage: AiRequestUsage) {
    const totalTokens = usage.promptTokens + usage.completionTokens;
    const cost = this.calculateCost(usage.model, usage.promptTokens, usage.completionTokens);

    log.info(
      {
        userId: usage.userId,
        model: usage.model,
        totalTokens,
        cost,
        latencyMs: usage.latencyMs,
      },
      'Tracked AI Request Usage',
    );

    return {
      totalTokens,
      cost,
    };
  }
}
