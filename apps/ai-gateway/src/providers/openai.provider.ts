import { Injectable } from '@nestjs/common';
import {
  OpenAIProvider,
  type IAIProvider,
  type AIMessage,
  type AIResponse,
  type AIOptions,
} from '@ai-platform/ai-sdk';
import { AIProvider } from '@ai-platform/types';

@Injectable()
export class OpenAIProviderService implements IAIProvider {
  readonly provider = AIProvider.OPENAI;
  private readonly providerInstance = new OpenAIProvider();

  async complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    return this.providerInstance.complete(messages, options);
  }

  async embed(text: string): Promise<number[]> {
    return this.providerInstance.embed(text);
  }
}
