import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { PromptTemplatesService } from '../ai/prompt-templates.service.js';
import { RagService } from '../rag/rag.service.js';
import { RedisService } from '../../redis/redis.service.js';
import {
  AIRole,
  ConversationStatus,
  SenderType,
  AITask,
  UserRole,
  FREE_PLAN_DAILY_LIMIT,
  CACHE_KEYS,
  CACHE_TTL,
} from '@ai-platform/types';
import { GamificationService } from '../gamification/gamification.service.js';
import type { AIMessage } from '@ai-platform/ai-sdk';
import { createLogger } from '@ai-platform/logger';
import type {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
  QueryConversationDto,
} from './dto/index.js';

const log = createLogger('ConversationsService');

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly promptTemplatesService: PromptTemplatesService,
    private readonly ragService: RagService,
    private readonly redisService: RedisService,
    private readonly gamificationService: GamificationService,
  ) {}

  /**
   * Check if user exceeded daily conversation limit
   */
  private async checkDailyQuota(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === UserRole.PREMIUM || user?.role === UserRole.ADMIN) {
      return; // Unlimited
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const countToday = await this.prisma.conversation.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    if (countToday >= FREE_PLAN_DAILY_LIMIT) {
      throw new ForbiddenException(
        `You have reached the free plan daily limit of ${FREE_PLAN_DAILY_LIMIT} conversations. Upgrade to Premium for unlimited access!`,
      );
    }
  }

  /**
   * Map AIRole to prompt template name
   */
  private getTemplateNameForRole(role?: string | null): string {
    switch (role) {
      case AIRole.INTERVIEWER:
        return 'conversation_interviewer';
      case AIRole.FRIEND:
        return 'conversation_friend';
      case AIRole.IELTS_EXAMINER:
      case AIRole.EXAMINER:
        return 'ielts_examiner';
      case AIRole.BUSINESS_PARTNER:
        return 'business_mentor';
      case AIRole.TEACHER:
      default:
        return 'conversation_teacher';
    }
  }

  /**
   * Determine optimal AITask for router matrix
   */
  private getTaskForRoleAndMessage(role?: string | null, message = ''): AITask {
    const lower = message.toLowerCase();
    if (lower.includes('check grammar') || lower.includes('correct my sentence') || lower.includes('is this correct')) {
      return AITask.GRAMMAR_CORRECTION;
    }
    if (role === AIRole.IELTS_EXAMINER || role === AIRole.EXAMINER) {
      return AITask.IELTS_FEEDBACK;
    }
    if (role === AIRole.INTERVIEWER || role === AIRole.BUSINESS_PARTNER) {
      return AITask.LONG_CONVERSATION;
    }
    return AITask.QUICK_CHAT;
  }

  /**
   * Start a new conversation
   */
  async createConversation(userId: string, dto: CreateConversationDto) {
    await this.checkDailyQuota(userId);

    const title = dto.title ?? `${dto.aiRole ?? 'AI Tutor'} Practice: ${dto.topic ?? 'General'}`;
    const role = dto.aiRole ?? AIRole.TEACHER;
    const topic = dto.topic ?? 'Daily Life';

    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title,
        topic,
        aiRole: role,
        status: ConversationStatus.ACTIVE,
      },
    });

    // Generate welcoming initial icebreaker message
    let initialGreeting = `Hello! I'm your ${role} today. We will be practicing speaking about "${topic}". How are you doing today? What would you like to focus on?`;
    if (role === AIRole.INTERVIEWER) {
      initialGreeting = `Hello and welcome! Thank you for taking the time to speak with me today for this ${topic} interview. To get started, could you briefly introduce yourself and your background?`;
    } else if (role === AIRole.IELTS_EXAMINER) {
      initialGreeting = `Good day! Welcome to your IELTS Speaking test practice. My name is your examiner. In this session, we will cover Part 1, 2, and 3 topics. Could you please tell me your full name and what you do?`;
    } else if (role === AIRole.FRIEND) {
      initialGreeting = `Hey there! Great to catch up with you. We're chatting about ${topic} today! How has your week been so far?`;
    }

    const aiMessage = await this.prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: SenderType.AI,
        message: initialGreeting,
        modelName: 'initial-greeting',
        tokenUsage: 35,
      },
    });

    // Cache initial state in Redis
    await this.redisService.setJson(
      CACHE_KEYS.conversation(conversation.id),
      { ...conversation, messageCount: 1 },
      CACHE_TTL.SESSION,
    );

    log.info({ conversationId: conversation.id, userId, role }, 'Started conversation');

    return {
      ...conversation,
      messages: [aiMessage],
    };
  }

  /**
   * List conversations for user
   */
  async getUserConversations(userId: string, query: QueryConversationDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 15)));
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { message: true, senderType: true, createdAt: true },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: items.map((c) => ({
        id: c.id,
        title: c.title,
        topic: c.topic,
        aiRole: c.aiRole,
        status: c.status,
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.message ?? null,
        lastMessageSender: c.messages[0]?.senderType ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single conversation with full message history and context
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        contexts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    return conversation;
  }

  /**
   * Send a user message, process RAG & memory, invoke AI, and save response
   */
  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        contexts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    if (conversation.status === ConversationStatus.ENDED) {
      throw new BadRequestException('This conversation has ended. Start a new one to continue practicing.');
    }

    // 1. Save user message
    const userMsg = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        senderType: SenderType.USER,
        message: dto.message,
      },
    });

    // 2. Fetch User Profile for personalization
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    // 3. RAG Knowledge Retrieval
    const ragContext = await this.ragService.buildAugmentedContext(
      dto.message,
      undefined,
      userId,
    );

    // 4. Context Compression: If messages > 10, summarize older messages
    const allMessages = [...conversation.messages, userMsg];
    let compressedContextText = '';

    if (allMessages.length > 10) {
      const olderMessages = allMessages.slice(0, allMessages.length - 6);
      const summaryNotes = olderMessages
        .map((m) => `${m.senderType}: ${m.message.slice(0, 80)}`)
        .join(' | ');

      compressedContextText = `Previous conversation summary: ${summaryNotes}`;

      // Persist to conversation_contexts
      await this.prisma.conversationContext.create({
        data: {
          conversationId,
          contextJson: {
            summary: compressedContextText,
            turnCount: allMessages.length,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } else if (conversation.contexts[0]?.contextJson) {
      const parsed = conversation.contexts[0].contextJson as { summary?: string };
      if (parsed.summary) compressedContextText = parsed.summary;
    }

    // 5. Render Prompt Template
    const templateName = this.getTemplateNameForRole(conversation.aiRole);
    const systemPrompt = await this.promptTemplatesService.renderTemplate(templateName, {
      role: conversation.aiRole ?? 'English Teacher',
      topic: conversation.topic ?? 'General Conversation',
      userLevel: profile?.englishLevel ?? 'Intermediate (B1/B2)',
      learningGoal: profile?.learningGoal ?? 'Improve Fluency and Vocabulary',
      ragContext: [ragContext, compressedContextText].filter(Boolean).join('\n\n'),
    });

    // 6. Build AIMessages array (keep last 8 turns for optimal token balance)
    const recentTurns = allMessages.slice(-8);
    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentTurns.map((m) => ({
        role: m.senderType === SenderType.USER ? ('user' as const) : ('assistant' as const),
        content: m.message,
      })),
    ];

    // 7. Route and execute AI task
    const task = this.getTaskForRoleAndMessage(conversation.aiRole, dto.message);
    const aiResponse = await this.aiService.complete(task, aiMessages, userId);

    // 8. Save AI response
    const savedAiMsg = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        senderType: SenderType.AI,
        message: aiResponse.content,
        modelName: aiResponse.model,
        tokenUsage: aiResponse.tokensUsed,
      },
    });

    // 9. Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 10. Cache in Redis
    await this.redisService.setJson(
      CACHE_KEYS.conversation(conversationId),
      {
        lastMessage: savedAiMsg.message,
        messageCount: allMessages.length + 1,
        updatedAt: new Date().toISOString(),
      },
      CACHE_TTL.SESSION,
    );

    // 11. Record gamification streak & unlock achievements
    this.gamificationService.recordActivity(userId).catch((e) => {
      log.warn({ e }, 'Failed to record streak activity');
    });

    return {
      userMessage: userMsg,
      aiMessage: savedAiMsg,
      metadata: {
        model: aiResponse.model,
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed,
        latencyMs: aiResponse.latencyMs,
      },
    };
  }

  /**
   * Update conversation (status, topic, title)
   */
  async updateConversation(conversationId: string, userId: string, dto: UpdateConversationDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.topic ? { topic: dto.topic } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    await this.redisService.del(CACHE_KEYS.conversation(conversationId));

    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
