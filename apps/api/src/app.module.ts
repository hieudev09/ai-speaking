import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { LessonsModule } from './modules/lessons/lessons.module.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
import { AssessmentsModule } from './modules/assessments/assessments.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { RagModule } from './modules/rag/rag.module.js';
import { RedisModule } from './redis/redis.module.js';
import { GamificationModule } from './modules/gamification/gamification.module.js';
import { RecommendationsModule } from './modules/recommendations/recommendations.module.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    BullModule.forRoot({
      connection: {
        url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
      },
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    ConversationsModule,
    AssessmentsModule,
    SubscriptionsModule,
    PaymentsModule,
    AnalyticsModule,
    NotificationsModule,
    GamificationModule,
    RecommendationsModule,
    AdminModule,
    AiModule,
    RagModule,
  ],
})
export class AppModule {}
