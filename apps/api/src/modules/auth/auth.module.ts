import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '@ai-platform/types';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard, RolesGuard, PremiumGuard } from './guards/index.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.EMAIL,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, PremiumGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, PremiumGuard],
})
export class AuthModule {}
