import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { QuotaGuard } from './guards/quota.guard.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, QuotaGuard],
  exports: [SubscriptionsService, QuotaGuard],
})
export class SubscriptionsModule {}
