import { apiRequest } from './api';
import type {
  SubscriptionPlanDto,
  UserSubscriptionDto,
  QuotaStatusDto,
} from '@ai-platform/types';

export async function getSubscriptionPlans(): Promise<SubscriptionPlanDto[]> {
  return apiRequest<SubscriptionPlanDto[]>('/subscriptions/plans');
}

export async function getCurrentSubscription(): Promise<UserSubscriptionDto> {
  return apiRequest<UserSubscriptionDto>('/subscriptions/current');
}

export async function getQuotaStatus(): Promise<QuotaStatusDto> {
  return apiRequest<QuotaStatusDto>('/subscriptions/quota');
}

export async function upgradePlan(planId: string, durationDays?: number): Promise<UserSubscriptionDto> {
  return apiRequest<UserSubscriptionDto>('/subscriptions/upgrade', {
    method: 'POST',
    body: JSON.stringify({ planId, durationDays }),
  });
}
