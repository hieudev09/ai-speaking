import { Injectable } from '@nestjs/common';
import { AIRouter, type AIMessage, type AIResponse } from '@ai-platform/ai-sdk';
import { AITask } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('AIRouterService');

@Injectable()
export class AIRouterService {
  private readonly router = new AIRouter();

  async route(task: AITask, messages: AIMessage[]): Promise<AIResponse> {
    const provider = this.router.getProviderForTask(task);
    log.info({ task, provider }, 'Routing AI request');
    return this.router.route(task, messages);
  }

  getProviderForTask(task: AITask) {
    return this.router.getProviderForTask(task);
  }
}
