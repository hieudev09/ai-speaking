import { Injectable } from '@nestjs/common';
import {
  GeminiProvider,
  type IAIProvider,
  type AIMessage,
  type AIResponse,
  type AIOptions,
} from '@ai-platform/ai-sdk';
import { AIProvider } from '@ai-platform/types';

@Injectable()
export class GeminiProviderService implements IAIProvider {
  readonly provider = AIProvider.GEMINI;
  private readonly providerInstance = new GeminiProvider();

  async complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    return this.providerInstance.complete(messages, options);
  }

  async embed(text: string): Promise<number[]> {
    return this.providerInstance.embed(text);
  }
}
