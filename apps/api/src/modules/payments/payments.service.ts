import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import type {
  CreateCheckoutDto,
  CheckoutResponseDto,
  PaymentDto,
  PaymentStatus,
} from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('PaymentsService');

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Create a checkout session (Stripe or Mock dev fallback)
   */
  async createCheckoutSession(userId: string, dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan ${dto.planId} not found`);
    }

    if (Number(plan.price) === 0) {
      throw new BadRequestException('Cannot create checkout for free plan');
    }

    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';
    const successUrl = dto.successUrl || `${frontendUrl}/pricing/success?plan_id=${plan.id}`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/pricing/cancel`;

    const stripeKey = process.env['STRIPE_SECRET_KEY'];
    const isStripeConfigured = stripeKey && !stripeKey.includes('...') && stripeKey.startsWith('sk_');

    if (isStripeConfigured) {
      try {
        // Use Stripe REST API
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('success_url', successUrl + '&session_id={CHECKOUT_SESSION_ID}');
        params.append('cancel_url', cancelUrl);
        params.append('client_reference_id', userId);
        params.append('metadata[userId]', userId);
        params.append('metadata[planId]', plan.id);
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][unit_amount]', Math.round(Number(plan.price) * 100).toString());
        params.append('line_items[0][price_data][product_data][name]', plan.name);
        params.append('line_items[0][quantity]', '1');

        const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (res.ok) {
          const session = (await res.json()) as any;
          return {
            sessionId: session.id,
            checkoutUrl: session.url,
            isMock: false,
          };
        }
        log.warn({ status: res.status }, 'Stripe API returned non-OK status, falling back to sandbox mode');
      } catch (err) {
        log.warn({ err }, 'Stripe checkout creation failed, falling back to sandbox mode');
      }
    }

    // Development / Sandbox fallback session
    const mockSessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockCheckoutUrl = `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id=${mockSessionId}&mock=true`;

    return {
      sessionId: mockSessionId,
      checkoutUrl: mockCheckoutUrl,
      isMock: true,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(body: any): Promise<{ received: boolean }> {
    const eventType = body?.type;
    const session = body?.data?.object;

    log.info({ eventType }, 'Received payment webhook');

    if (eventType === 'checkout.session.completed') {
      const userId = session?.metadata?.userId || session?.client_reference_id;
      const planId = session?.metadata?.planId;
      const amount = session?.amount_total ? session.amount_total / 100 : 0;
      const externalId = session?.payment_intent || session?.id;

      if (userId && planId) {
        await this.recordSuccessfulPayment(userId, planId, amount, externalId);
      }
    }

    return { received: true };
  }

  /**
   * Direct complete payment (for mock checkout or manual testing)
   */
  async completeMockCheckout(userId: string, planId: string): Promise<PaymentDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan ${planId} not found`);
    }

    const mockExternalId = `mock_pi_${Date.now()}`;
    return this.recordSuccessfulPayment(userId, planId, Number(plan.price), mockExternalId);
  }

  /**
   * Helper to record successful payment, invoice, and upgrade subscription
   */
  private async recordSuccessfulPayment(
    userId: string,
    planId: string,
    amount: number,
    externalId: string,
  ): Promise<PaymentDto> {
    // 1. Upgrade user subscription
    const sub = await this.subscriptionsService.upgradeUserPlan(userId, planId);

    // 2. Create Payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: sub.id,
        amount,
        currency: 'USD',
        paymentProvider: externalId.startsWith('mock') ? 'sandbox' : 'stripe',
        paymentStatus: 'completed',
        externalId,
      },
    });

    // 3. Create Invoice record
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const invoice = await this.prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber,
        invoiceUrl: `/invoices/${invoiceNumber}.pdf`,
      },
    });

    log.info({ userId, paymentId: payment.id, invoiceNumber }, 'Payment recorded and invoice generated');

    return {
      id: payment.id,
      userId: payment.userId,
      subscriptionId: payment.subscriptionId,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentProvider: payment.paymentProvider,
      paymentStatus: payment.paymentStatus as PaymentStatus,
      externalId: payment.externalId,
      createdAt: payment.createdAt.toISOString(),
      invoice: {
        id: invoice.id,
        paymentId: invoice.paymentId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceUrl: invoice.invoiceUrl,
        createdAt: invoice.createdAt.toISOString(),
      },
    };
  }

  /**
   * Get user payment history
   */
  async getPaymentHistory(userId: string): Promise<PaymentDto[]> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      subscriptionId: p.subscriptionId,
      amount: Number(p.amount),
      currency: p.currency,
      paymentProvider: p.paymentProvider,
      paymentStatus: p.paymentStatus as PaymentStatus,
      externalId: p.externalId,
      createdAt: p.createdAt.toISOString(),
      invoice: p.invoice
        ? {
            id: p.invoice.id,
            paymentId: p.invoice.paymentId,
            invoiceNumber: p.invoice.invoiceNumber,
            invoiceUrl: p.invoice.invoiceUrl,
            createdAt: p.invoice.createdAt.toISOString(),
          }
        : null,
    }));
  }
}
