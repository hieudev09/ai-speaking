import { AIProvider, AITask } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('AISDK');

// ==================== INTERFACES ====================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  model?: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  promptTokens?: number;
  completionTokens?: number;
  model: string;
  provider: AIProvider;
  latencyMs: number;
}

export interface IAIProvider {
  complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse>;
  embed?(text: string): Promise<number[]>;
  readonly provider: AIProvider;
}

// ==================== ROUTING MATRIX & FALLBACK CHAIN ====================

export const ROUTING_MATRIX: Record<AITask, AIProvider> = {
  [AITask.GRAMMAR_CORRECTION]: AIProvider.OPENAI,
  [AITask.PRONUNCIATION_FEEDBACK]: AIProvider.OPENAI,
  [AITask.KNOWLEDGE_SEARCH]: AIProvider.OPENAI,
  [AITask.SPEAKING_ASSESSMENT]: AIProvider.OPENAI,
  [AITask.LONG_CONVERSATION]: AIProvider.CLAUDE,
  [AITask.STUDY_PLAN]: AIProvider.CLAUDE,
  [AITask.IELTS_FEEDBACK]: AIProvider.CLAUDE,
  [AITask.QUICK_CHAT]: AIProvider.GEMINI,
  [AITask.DAILY_PRACTICE]: AIProvider.GEMINI,
};

export const FALLBACK_CHAIN: AIProvider[] = [
  AIProvider.OPENAI,
  AIProvider.CLAUDE,
  AIProvider.GEMINI,
];

// ==================== COST ESTIMATION ====================

/** Pricing per 1M tokens in USD */
export const MODEL_PRICING: Record<string, { promptPerM: number; completionPerM: number }> = {
  'gpt-4o': { promptPerM: 2.5, completionPerM: 10.0 },
  'gpt-4o-mini': { promptPerM: 0.15, completionPerM: 0.60 },
  'claude-3-5-sonnet-20241022': { promptPerM: 3.0, completionPerM: 15.0 },
  'claude-3-haiku-20240307': { promptPerM: 0.25, completionPerM: 1.25 },
  'gemini-1.5-flash': { promptPerM: 0.075, completionPerM: 0.30 },
  'gemini-1.5-pro': { promptPerM: 1.25, completionPerM: 5.00 },
  'text-embedding-3-small': { promptPerM: 0.02, completionPerM: 0 },
  'text-embedding-3-large': { promptPerM: 0.13, completionPerM: 0 },
};

export function calculateAiCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = MODEL_PRICING[model] ?? { promptPerM: 0.5, completionPerM: 1.5 };
  const cost =
    (promptTokens / 1_000_000) * pricing.promptPerM +
    (completionTokens / 1_000_000) * pricing.completionPerM;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

// ==================== DETERMINISTIC DEV FALLBACK MOCK ====================

function generateMockEmbedding(text: string, dimensions = 1536): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * 31 + i * 17) % dimensions;
    vector[index] = (vector[index] ?? 0) + (charCode / 255);
  }
  // Normalize vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

function generateDevResponse(messages: AIMessage[], _provider: AIProvider): string {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
  const lowerMsg = lastUserMsg.toLowerCase();

  if (systemMsg.includes('IELTS')) {
    return `That's a thoughtful response. In IELTS Speaking, expanding on your answer with concrete examples and cohesive devices will improve your Fluency & Coherence score. 

For instance, consider explaining:
1. What personal experience influenced your view?
2. What are the broader societal implications?

Could you elaborate on how this specifically impacts daily life?`;
  }

  if (systemMsg.includes('Interviewer') || lowerMsg.includes('interview') || lowerMsg.includes('experience')) {
    return `Thank you for sharing that overview. In this role, communication and problem-solving are paramount.

Can you describe a specific situation where you faced an unexpected challenge during a project, what actions you took, and what the final outcome was?`;
  }

  if (systemMsg.includes('Teacher') || lowerMsg.includes('grammar') || lowerMsg.includes('correct')) {
    return `Excellent effort! Your message communicates your idea clearly. 

💡 *Language Tip*: To sound even more natural, you can use varied sentence structures and strong adjectives. 
Notice: "${lastUserMsg.slice(0, 60)}..." is well understood!

Let's keep practicing: Can you tell me a little more about your main goal for today's lesson?`;
  }

  if (systemMsg.includes('Business') || lowerMsg.includes('meeting') || lowerMsg.includes('proposal')) {
    return `That's a sound business point. In professional negotiations, clarity and diplomatic framing lead to the best outcomes.

From a strategic perspective, how would you recommend presenting this proposal to key stakeholders to gain immediate buy-in?`;
  }

  // Friendly conversational partner default
  return `That sounds really interesting! I love chatting with you about this. 

Speaking English regularly in conversational contexts like this is the fastest way to build confidence and fluency. 

What made you think of that today? Tell me more!`;
}

// ==================== PROVIDER IMPLEMENTATIONS ====================

export class OpenAIProvider implements IAIProvider {
  readonly provider = AIProvider.OPENAI;

  async complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = process.env['OPENAI_API_KEY'];
    const model = options?.model ?? 'gpt-4o-mini';

    if (!apiKey || apiKey === 'sk-...' || apiKey.startsWith('sk-placeholder')) {
      log.info('Using OpenAI development fallback mode (no OPENAI_API_KEY configured)');
      const content = generateDevResponse(messages, this.provider);
      const promptTokens = messages.reduce((acc, m) => acc + m.content.split(/\s+/).length * 2, 0);
      const completionTokens = content.split(/\s+/).length * 2;
      return {
        content,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model: `${model}-dev-mock`,
        provider: this.provider,
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 800,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model: string;
      };

      const content = data.choices[0]?.message?.content ?? '';
      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;

      return {
        content,
        tokensUsed: data.usage?.total_tokens ?? promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model: data.model ?? model,
        provider: this.provider,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      log.warn({ err: error }, 'OpenAI provider call failed');
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey || apiKey === 'sk-...' || apiKey.startsWith('sk-placeholder')) {
      return generateMockEmbedding(text, 1536);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI embedding failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
      };
      return data.data[0]?.embedding ?? generateMockEmbedding(text, 1536);
    } catch (err) {
      log.warn({ err }, 'OpenAI embedding failed, falling back to deterministic vector');
      return generateMockEmbedding(text, 1536);
    }
  }
}

export class ClaudeProvider implements IAIProvider {
  readonly provider = AIProvider.CLAUDE;

  async complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    const model = options?.model ?? 'claude-3-5-sonnet-20241022';

    if (!apiKey || apiKey === 'sk-ant-...' || apiKey.startsWith('sk-ant-placeholder')) {
      log.info('Using Claude development fallback mode (no ANTHROPIC_API_KEY configured)');
      const content = generateDevResponse(messages, this.provider);
      const promptTokens = messages.reduce((acc, m) => acc + m.content.split(/\s+/).length * 2, 0);
      const completionTokens = content.split(/\s+/).length * 2;
      return {
        content,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model: `${model}-dev-mock`,
        provider: this.provider,
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const systemMessage = messages.find((m) => m.role === 'system')?.content;
      const userAndAssistant = messages.filter((m) => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemMessage,
          messages: userAndAssistant.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          max_tokens: options?.maxTokens ?? 800,
          temperature: options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic Claude API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        content: Array<{ type: string; text: string }>;
        usage?: { input_tokens: number; output_tokens: number };
        model: string;
      };

      const content = data.content.map((c) => c.text).join('');
      const promptTokens = data.usage?.input_tokens ?? 0;
      const completionTokens = data.usage?.output_tokens ?? 0;

      return {
        content,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model: data.model ?? model,
        provider: this.provider,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      log.warn({ err: error }, 'Claude provider call failed');
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    return generateMockEmbedding(text, 1536);
  }
}

export class GeminiProvider implements IAIProvider {
  readonly provider = AIProvider.GEMINI;

  async complete(messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = process.env['GOOGLE_AI_API_KEY'];
    const model = options?.model ?? 'gemini-1.5-flash';

    if (!apiKey || apiKey === 'AIza...' || apiKey.startsWith('AIza-placeholder')) {
      log.info('Using Gemini development fallback mode (no GOOGLE_AI_API_KEY configured)');
      const content = generateDevResponse(messages, this.provider);
      const promptTokens = messages.reduce((acc, m) => acc + m.content.split(/\s+/).length * 2, 0);
      const completionTokens = content.split(/\s+/).length * 2;
      return {
        content,
        tokensUsed: promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model: `${model}-dev-mock`,
        provider: this.provider,
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const systemInstruction = messages.find((m) => m.role === 'system')?.content;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 800,
        },
      };

      if (systemInstruction) {
        body['systemInstruction'] = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Gemini API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const content =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount ?? 0;

      return {
        content,
        tokensUsed: data.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens,
        promptTokens,
        completionTokens,
        model,
        provider: this.provider,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      log.warn({ err: error }, 'Gemini provider call failed');
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    return generateMockEmbedding(text, 1536);
  }
}

// ==================== AI ROUTER ====================

export class AIRouter {
  private providers: Map<AIProvider, IAIProvider>;

  constructor() {
    this.providers = new Map<AIProvider, IAIProvider>([
      [AIProvider.OPENAI, new OpenAIProvider()],
      [AIProvider.CLAUDE, new ClaudeProvider()],
      [AIProvider.GEMINI, new GeminiProvider()],
    ]);
  }

  getProvider(provider: AIProvider): IAIProvider | undefined {
    return this.providers.get(provider);
  }

  getProviderForTask(task: AITask): AIProvider {
    return ROUTING_MATRIX[task] ?? AIProvider.OPENAI;
  }

  async route(task: AITask, messages: AIMessage[], options?: AIOptions): Promise<AIResponse> {
    const primaryProvider = this.getProviderForTask(task);
    const chain = [primaryProvider, ...FALLBACK_CHAIN.filter((p) => p !== primaryProvider)];

    for (const providerName of chain) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;
      try {
        log.debug({ provider: providerName, task }, 'Attempting AI completion');
        return await provider.complete(messages, options);
      } catch (err) {
        log.warn({ provider: providerName, task, err }, 'Provider failed, trying fallback');
      }
    }

    // Final fallback — static graceful message
    return {
      content:
        'I am currently experiencing higher than usual traffic, but I am here with you! Could you please repeat what you would like to practice?',
      tokensUsed: 25,
      promptTokens: 20,
      completionTokens: 5,
      model: 'fallback-static',
      provider: AIProvider.OPENAI,
      latencyMs: 1,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const openAI = this.providers.get(AIProvider.OPENAI);
    if (openAI?.embed) {
      try {
        return await openAI.embed(text);
      } catch {
        // fallback
      }
    }
    return generateMockEmbedding(text, 1536);
  }
}

export { AITask, AIProvider };
