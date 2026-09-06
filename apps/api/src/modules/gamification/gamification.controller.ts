import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('streak')
  async getStreak(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getStreak(user.sub);
  }

  @Get('achievements')
  async getAchievements(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.getAchievements(user.sub);
  }

  @Post('record-activity')
  async recordActivity(@CurrentUser() user: JwtPayload) {
    return this.gamificationService.recordActivity(user.sub);
  }
}
