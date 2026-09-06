import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueName, type AnalyticsJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';
import { PrismaService } from '../prisma.service.js';

const log = createLogger('AnalyticsProcessor');

@Processor(QueueName.ANALYTICS)
export class AnalyticsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AnalyticsJobPayload>): Promise<void> {
    const { date } = job.data;
    log.info({ jobId: job.id, date }, 'Processing analytics daily aggregation job');

    try {
      const targetDate = date ? new Date(date) : new Date();
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

      await this.prisma.dailyStatistic.upsert({
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

      log.info({ date: dayStart.toISOString(), activeUsers, totalConversations }, 'Daily stats aggregated');
    } catch (err) {
      log.error({ err, date }, 'Failed to aggregate daily statistics');
      throw err;
    }
  }
}
