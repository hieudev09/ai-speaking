import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  UserRole,
  type AnalyticsDashboardDto,
  type UserAnalyticsDto,
  type DailyTrendDto,
} from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('AnalyticsService');

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an analytics event
   */
  async trackEvent(
    userId: string | null | undefined,
    eventName: string,
    eventData?: Record<string, any>,
  ) {
    try {
      const event = await this.prisma.analyticsEvent.create({
        data: {
          userId: userId || null,
          eventName,
          eventData: eventData ?? {},
        },
      });
      return event;
    } catch (err) {
      log.warn({ err, eventName }, 'Failed to record analytics event');
      return null;
    }
  }

  /**
   * Aggregate stats for a specific date and upsert into daily_statistics
   */
  async aggregateDailyStats(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [newUsers, activeEvents, totalConversations, totalAssessments, totalAiRequests] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        this.prisma.analyticsEvent.findMany({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            userId: { not: null },
          },
          select: { userId: true },
          distinct: ['userId'],
        }),
        this.prisma.conversation.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        this.prisma.assessment.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        this.prisma.aiRequest.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
      ]);

    const activeUsers = Math.max(activeEvents.length, totalConversations > 0 ? 1 : 0);

    const stat = await this.prisma.dailyStatistic.upsert({
      where: { date: dayStart },
      update: {
        activeUsers,
        newUsers,
        totalConversations,
        totalAssessments,
        totalAiRequests,
      },
      create: {
        date: dayStart,
        activeUsers,
        newUsers,
        totalConversations,
        totalAssessments,
        totalAiRequests,
      },
    });

    log.info({ date: dayStart.toISOString(), stat }, 'Aggregated daily statistics');
    return stat;
  }

  /**
   * Get comprehensive KPIs for the Admin Dashboard
   */
  async getDashboardKPIs(): Promise<AnalyticsDashboardDto> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalConversations,
      totalAssessments,
      completedPayments,
      premiumUsersCount,
      freeUsersCount,
      recentStats,
      todayActiveUsers,
      thirtyDaysActiveUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.conversation.count(),
      this.prisma.assessment.count(),
      this.prisma.payment.findMany({
        where: { paymentStatus: 'completed' },
        select: { amount: true },
      }),
      this.prisma.user.count({ where: { role: UserRole.PREMIUM } }),
      this.prisma.user.count({ where: { role: UserRole.USER } }),
      this.prisma.dailyStatistic.findMany({
        orderBy: { date: 'desc' },
        take: 7,
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: todayStart } },
      }),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const dau = Math.max(todayActiveUsers, 1);
    const mau = Math.max(thirtyDaysActiveUsers, totalUsers);

    // Build daily trends
    const dailyTrends: DailyTrendDto[] = recentStats.map((s) => ({
      date: s.date.toISOString().split('T')[0]!,
      activeUsers: s.activeUsers,
      newUsers: s.newUsers,
      conversations: s.totalConversations,
      assessments: s.totalAssessments,
    }));

    if (dailyTrends.length === 0) {
      // Provide current baseline trend if seed stats not populated
      const todayStr = now.toISOString().split('T')[0]!;
      dailyTrends.push({
        date: todayStr,
        activeUsers: dau,
        newUsers: totalUsers,
        conversations: totalConversations,
        assessments: totalAssessments,
      });
    }

    return {
      totalUsers,
      dau,
      mau,
      totalConversations,
      totalAssessments,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      planBreakdown: {
        free: freeUsersCount,
        premium: premiumUsersCount,
      },
      dailyTrends,
    };
  }

  /**
   * Get individual user learning metrics
   */
  async getUserStats(userId: string): Promise<UserAnalyticsDto> {
    const [convCount, assessments, streak] = await Promise.all([
      this.prisma.conversation.count({ where: { userId } }),
      this.prisma.assessment.findMany({
        where: { userId },
        select: { overallScore: true },
      }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
    ]);

    let avgScore = 70;
    if (assessments.length > 0) {
      const sum = assessments.reduce((acc, a) => acc + Number(a.overallScore ?? 70), 0);
      avgScore = Math.round(sum / assessments.length);
    }

    // Estimate total speaking minutes: ~3 minutes per conversation message/assessment
    const totalMinutes = convCount * 3 + assessments.length * 2;

    return {
      totalConversations: convCount,
      totalAssessments: assessments.length,
      averageScore: avgScore,
      totalMinutes,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  }
}
