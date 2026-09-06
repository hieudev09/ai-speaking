import { apiRequest } from './api';
import type { UserRecommendationsDto } from '@ai-platform/types';

export async function getUserRecommendations(): Promise<UserRecommendationsDto> {
  return apiRequest<UserRecommendationsDto>('/recommendations');
}
