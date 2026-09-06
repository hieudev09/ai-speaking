import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(@CurrentUser() user: JwtPayload) {
    return this.recommendationsService.getRecommendations(user.sub);
  }
}
