import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser, Public } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';
import type { CreateCheckoutDto } from '@ai-platform/types';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckoutSession(user.sub, dto);
  }

  @Public()
  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mock-complete')
  async mockComplete(
    @CurrentUser() user: JwtPayload,
    @Body('planId') planId: string,
  ) {
    return this.paymentsService.completeMockCheckout(user.sub, planId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getPaymentHistory(user.sub);
  }
}
