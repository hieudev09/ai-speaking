import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AdminUserDto,
  UpdateUserStatusDto,
  AdminAuditLogDto,
  PromptTemplateDto,
  UpdatePromptTemplateDto,
} from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('AdminService');

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to write an audit log entry
   */
  async logAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, any>,
  ) {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          metadata: metadata ?? {},
        },
      });
    } catch (err) {
      log.warn({ err, action }, 'Failed to write admin audit log');
    }
  }

  /**
   * List all users with learning & subscription metrics
   */
  async getUsers(search?: string, role?: string, status?: string): Promise<AdminUserDto[]> {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await this.prisma.user.findMany({
      where,
      include: {
        profile: true,
        subscriptions: {
          where: { status: 'active' },
          include: { plan: true },
          take: 1,
        },
        _count: {
          select: {
            conversations: true,
            assessments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      profile: u.profile
        ? {
            firstName: u.profile.firstName,
            lastName: u.profile.lastName,
            englishLevel: u.profile.englishLevel,
            learningGoal: u.profile.learningGoal,
          }
        : null,
      conversationCount: u._count.conversations,
      assessmentCount: u._count.assessments,
      currentPlan: u.subscriptions[0]?.plan.name ?? (u.role === 'premium' ? 'Premium' : 'Free'),
    }));
  }

  /**
   * Update user status or role (e.g. suspend user or grant admin)
   */
  async updateUser(adminId: string, targetUserId: string, dto: UpdateUserStatusDto): Promise<AdminUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: dto.status ?? undefined,
        role: dto.role ?? undefined,
      },
      include: {
        profile: true,
        subscriptions: {
          where: { status: 'active' },
          include: { plan: true },
          take: 1,
        },
        _count: {
          select: {
            conversations: true,
            assessments: true,
          },
        },
      },
    });

    await this.logAction(adminId, 'UPDATE_USER', 'user', targetUserId, {
      oldStatus: user.status,
      newStatus: dto.status,
      oldRole: user.role,
      newRole: dto.role,
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt.toISOString(),
      lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
      profile: updated.profile
        ? {
            firstName: updated.profile.firstName,
            lastName: updated.profile.lastName,
            englishLevel: updated.profile.englishLevel,
            learningGoal: updated.profile.learningGoal,
          }
        : null,
      conversationCount: updated._count.conversations,
      assessmentCount: updated._count.assessments,
      currentPlan: updated.subscriptions[0]?.plan.name ?? (updated.role === 'premium' ? 'Premium' : 'Free'),
    };
  }

  /**
   * Get all courses with lesson count and statistics
   */
  async getCourses() {
    return this.prisma.course.findMany({
      include: {
        lessons: {
          select: { id: true, title: true, lessonOrder: true },
          orderBy: { lessonOrder: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new course
   */
  async createCourse(
    adminId: string,
    dto: { title: string; slug: string; description?: string; level?: string; status?: string },
  ) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        level: dto.level || 'beginner',
        status: dto.status || 'published',
      },
    });

    await this.logAction(adminId, 'CREATE_COURSE', 'course', course.id, { title: course.title });
    return course;
  }

  /**
   * Update course
   */
  async updateCourse(
    adminId: string,
    courseId: string,
    dto: { title?: string; description?: string; level?: string; status?: string },
  ) {
    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: dto,
    });

    await this.logAction(adminId, 'UPDATE_COURSE', 'course', courseId, dto);
    return course;
  }

  /**
   * Get all prompt templates for AI persona control
   */
  async getPromptTemplates(): Promise<PromptTemplateDto[]> {
    const templates = await this.prisma.aiPromptTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      version: t.version,
      role: t.name,
      systemPrompt: t.templateContent,
      temperature: 0.7,
      active: t.active,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  /**
   * Update AI prompt template
   */
  async updatePromptTemplate(
    adminId: string,
    templateId: string,
    dto: UpdatePromptTemplateDto,
  ): Promise<PromptTemplateDto> {
    const updated = await this.prisma.aiPromptTemplate.update({
      where: { id: templateId },
      data: {
        templateContent: dto.systemPrompt ?? undefined,
        active: dto.active,
        version: { increment: 1 },
      },
    });

    await this.logAction(adminId, 'UPDATE_PROMPT_TEMPLATE', 'prompt_template', templateId, {
      name: updated.name,
      newVersion: updated.version,
    });

    return {
      id: updated.id,
      name: updated.name,
      version: updated.version,
      role: updated.name,
      systemPrompt: updated.templateContent,
      temperature: dto.temperature ?? 0.7,
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Get subscription plans for management
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Update subscription plan
   */
  async updatePlan(
    adminId: string,
    planId: string,
    dto: { price?: number; aiUsageLimit?: number; features?: string[] },
  ) {
    const updated = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        price: dto.price !== undefined ? dto.price : undefined,
        aiUsageLimit: dto.aiUsageLimit !== undefined ? dto.aiUsageLimit : undefined,
        features: dto.features ?? undefined,
      },
    });

    await this.logAction(adminId, 'UPDATE_PLAN', 'subscription_plan', planId, dto);
    return updated;
  }

  /**
   * Get admin audit logs
   */
  async getAuditLogs(limit = 50): Promise<AdminAuditLogDto[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      metadata: (l.metadata as Record<string, unknown>) || null,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}
