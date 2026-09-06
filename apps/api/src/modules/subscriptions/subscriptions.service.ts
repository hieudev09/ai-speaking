import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  FREE_PLAN_DAILY_LIMIT,
  UserRole,
  type SubscriptionPlanDto,
  type UserSubscriptionDto,
  type QuotaStatusDto,
} from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('SubscriptionsService');

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<SubscriptionPlanDto[]> {
    let plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });

    if (plans.length === 0) {
      // Fallback defaults if seed hasn't run yet
      return [
        {
          id: 'plan-free',
          name: 'Free',
          price: 0,
          durationDays: 36500,
          aiUsageLimit: FREE_PLAN_DAILY_LIMIT,
          features: ['10 AI conversations/day', 'Basic assessment', 'Course access'],
        },
        {
          id: 'plan-monthly',
          name: 'Premium Monthly',
          price: 9.99,
          durationDays: 30,
          aiUsageLimit: -1,
          features: [
            'Unlimited AI conversations',
            'Advanced pronunciation analysis & phonetics',
            'IELTS & TOEIC mock practice',
            'Personalized adaptive recommendations',
            'Priority queue processing',
          ],
        },
        {
          id: 'plan-yearly',
          name: 'Premium Yearly',
          price: 79.99,
          durationDays: 365,
          aiUsageLimit: -1,
          features: [
            'All Premium Monthly features',
            'Save 33% compared to monthly',
            'Custom AI persona creation',
            'Offline practice materials',
          ],
        },
      ];
    }

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      durationDays: p.durationDays,
      aiUsageLimit: p.aiUsageLimit,
      features: Array.isArray(p.features) ? (p.features as string[]) : [],
    }));
  }

  /**
   * Get current user subscription details
   */
  async getCurrentSubscription(userId: string): Promise<UserSubscriptionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });

    if (activeSub) {
      const now = new Date().getTime();
      const end = activeSub.endDate.getTime();
      const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      const isUnlimited = activeSub.plan.aiUsageLimit === -1;

      return {
        id: activeSub.id,
        userId: activeSub.userId,
        planId: activeSub.planId,
        planName: activeSub.plan.name,
        price: Number(activeSub.plan.price),
        startDate: activeSub.startDate.toISOString(),
        endDate: activeSub.endDate.toISOString(),
        status: activeSub.status,
        aiUsageLimit: activeSub.plan.aiUsageLimit,
        daysRemaining,
        isUnlimited,
      };
    }

    // Default to Free Plan
    const isSpecialRole = user?.role === UserRole.PREMIUM || user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

    return {
      id: 'free',
      userId,
      planId: 'free',
      planName: isSpecialRole ? 'Premium (Special Access)' : 'Free',
      price: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      status: 'active',
      aiUsageLimit: isSpecialRole ? -1 : FREE_PLAN_DAILY_LIMIT,
      daysRemaining: 365,
      isUnlimited: isSpecialRole,
    };
  }

  /**
   * Get quota status for user (daily AI practice allowance)
   */
  async getQuotaStatus(userId: string): Promise<QuotaStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gte: new Date() },
      },
      include: { plan: true },
    });

    const isUnlimited =
      user?.role === UserRole.PREMIUM ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPER_ADMIN ||
      (activeSub && activeSub.plan.aiUsageLimit === -1);

    if (isUnlimited) {
      return {
        usedToday: 0,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
        canProceed: true,
        planName: activeSub?.plan.name ?? 'Premium',
      };
    }

    // Count today's conversations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayConvs = await this.prisma.conversation.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    const limit = FREE_PLAN_DAILY_LIMIT;
    const remaining = Math.max(0, limit - todayConvs);

    return {
      usedToday: todayConvs,
      limit,
      remaining,
      isUnlimited: false,
      canProceed: remaining > 0,
      planName: 'Free',
    };
  }

  /**
   * Upgrade user plan
   */
  async upgradeUserPlan(userId: string, planId: string, durationDays?: number): Promise<UserSubscriptionDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan ${planId} not found`);
    }

    const duration = durationDays ?? plan.durationDays;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // Expire any existing active subscriptions
    await this.prisma.userSubscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'expired' },
    });

    // Create new subscription
    const newSub = await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        startDate,
        endDate,
        status: 'active',
      },
      include: { plan: true },
    });

    // Upgrade user role to premium
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.PREMIUM },
    });

    // Send in-app notification
    await this.prisma.notification.create({
      data: {
        userId,
        title: `🎉 Welcome to ${plan.name}!`,
        message: `Your account has been upgraded. Enjoy unlimited conversations and advanced learning features.`,
        type: 'subscription',
      },
    });

    log.info({ userId, planName: plan.name, duration }, 'User subscription upgraded');

    return {
      id: newSub.id,
      userId: newSub.userId,
      planId: newSub.planId,
      planName: newSub.plan.name,
      price: Number(newSub.plan.price),
      startDate: newSub.startDate.toISOString(),
      endDate: newSub.endDate.toISOString(),
      status: newSub.status,
      aiUsageLimit: newSub.plan.aiUsageLimit,
      daysRemaining: duration,
      isUnlimited: newSub.plan.aiUsageLimit === -1,
    };
  }
}
