import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser, Public } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getCurrentSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getCurrentSubscription(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quota')
  async getQuota(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getQuotaStatus(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  async upgradePlan(
    @CurrentUser() user: JwtPayload,
    @Body('planId') planId: string,
    @Body('durationDays') durationDays?: number,
  ) {
    return this.subscriptionsService.upgradeUserPlan(user.sub, planId, durationDays);
  }
}
