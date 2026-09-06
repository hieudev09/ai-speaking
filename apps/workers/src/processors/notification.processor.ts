import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueName, type NotificationJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';
import { PrismaService } from '../prisma.service.js';

const log = createLogger('NotificationProcessor');

@Processor(QueueName.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    const { userId, title, message, type } = job.data;
    log.info({ jobId: job.id, userId, type }, 'Processing notification job');

    try {
      // Check user preferences
      const settings = await this.prisma.userSettings.findUnique({
        where: { userId },
      });

      if (settings && !settings.notificationEnabled) {
        log.info({ userId }, 'User has disabled notifications, skipping push');
        return;
      }

      // Check if notification is already recorded in DB
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          title,
          message,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000), // within last minute
          },
        },
      });

      if (!existing) {
        await this.prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type || 'general',
          },
        });
      }

      log.info({ userId, title }, 'Notification dispatched successfully');
    } catch (err) {
      log.error({ err, userId }, 'Error processing notification job');
      throw err;
    }
  }
}
