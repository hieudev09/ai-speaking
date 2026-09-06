import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { CurrentUser, Roles, Public } from '../auth/decorators/index.js';
import { UserRole } from '@ai-platform/types';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('dashboard')
  async getDashboardKPIs() {
    return this.analyticsService.getDashboardKPIs();
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserStats(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getUserStats(user.sub);
  }

  @Public()
  @Post('events')
  async trackEvent(
    @Body('eventName') eventName: string,
    @Body('eventData') eventData?: Record<string, any>,
    @Body('userId') userId?: string,
  ) {
    return this.analyticsService.trackEvent(userId, eventName, eventData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('aggregate')
  async aggregate(@Body('date') date?: string) {
    return this.analyticsService.aggregateDailyStats(date);
  }
}
