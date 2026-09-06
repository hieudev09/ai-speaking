import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service.js';
import { GamificationController } from './gamification.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
