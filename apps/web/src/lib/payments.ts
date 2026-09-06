import { apiRequest } from './api';
import type {
  CreateCheckoutDto,
  CheckoutResponseDto,
  PaymentDto,
} from '@ai-platform/types';

export async function createCheckout(dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
  return apiRequest<CheckoutResponseDto>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function mockCompletePayment(planId: string): Promise<PaymentDto> {
  return apiRequest<PaymentDto>('/payments/mock-complete', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

export async function getPaymentHistory(): Promise<PaymentDto[]> {
  return apiRequest<PaymentDto[]>('/payments/history');
}
