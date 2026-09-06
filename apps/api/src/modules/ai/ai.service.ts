import { Injectable } from '@nestjs/common';
import {
  AIRouter,
  type AIMessage,
  type AIOptions,
  type AIResponse,
  calculateAiCost,
} from '@ai-platform/ai-sdk';
import { AITask, AIProvider } from '@ai-platform/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('AiService');

@Injectable()
export class AiService {
  private readonly router = new AIRouter();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute an AI request, route according to matrix, and log metrics to DB
   */
  async complete(
    task: AITask,
    messages: AIMessage[],
    userId?: string,
    options?: AIOptions,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const response = await this.router.route(task, messages, options);
    const latencyMs = Date.now() - startTime;

    const promptTokens = response.promptTokens ?? Math.round(response.tokensUsed * 0.7);
    const completionTokens = response.completionTokens ?? Math.round(response.tokensUsed * 0.3);
    const cost = calculateAiCost(response.model, promptTokens, completionTokens);

    if (userId) {
      try {
        // Find or create AiModel record
        let modelRecord = await this.prisma.aiModel.findFirst({
          where: { modelName: response.model },
        });

        if (!modelRecord) {
          modelRecord = await this.prisma.aiModel.create({
            data: {
              provider: response.provider,
              modelName: response.model,
              active: true,
            },
          });
        }

        await this.prisma.aiRequest.create({
          data: {
            userId,
            modelId: modelRecord.id,
            promptTokens,
            completionTokens,
            totalTokens: response.tokensUsed,
            cost,
            latencyMs,
          },
        });
      } catch (err) {
        log.warn({ err }, 'Failed to record AI request log in DB');
      }
    }

    return response;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.router.generateEmbedding(text);
  }

  getProviderForTask(task: AITask): AIProvider {
    return this.router.getProviderForTask(task);
  }
}
