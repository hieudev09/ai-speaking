import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service.js';
import { RecommendationsController } from './recommendations.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
