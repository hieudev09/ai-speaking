import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@ai-platform/types';
import { EmailProcessor } from './processors/email.processor.js';
import { SpeechProcessor } from './processors/speech.processor.js';
import { AssessmentProcessor } from './processors/assessment.processor.js';
import { AnalyticsProcessor } from './processors/analytics.processor.js';
import { NotificationProcessor } from './processors/notification.processor.js';
import { PrismaService } from './prisma.service.js';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env['REDIS_URL'] ?? 'redis://localhost:6379' },
    }),
    BullModule.registerQueue(
      { name: QueueName.EMAIL },
      { name: QueueName.SPEECH },
      { name: QueueName.ASSESSMENT },
      { name: QueueName.ANALYTICS },
      { name: QueueName.NOTIFICATION },
    ),
  ],
  providers: [
    PrismaService,
    EmailProcessor,
    SpeechProcessor,
    AssessmentProcessor,
    AnalyticsProcessor,
    NotificationProcessor,
  ],
})
export class WorkersModule {}
