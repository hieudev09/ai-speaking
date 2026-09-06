import { apiRequest } from './api';
import type {
  UserStreakDto,
  UserAchievementDto,
} from '@ai-platform/types';

export async function getUserStreak(): Promise<UserStreakDto> {
  return apiRequest<UserStreakDto>('/gamification/streak');
}

export async function getUserAchievements(): Promise<UserAchievementDto[]> {
  return apiRequest<UserAchievementDto[]>('/gamification/achievements');
}

export async function recordPracticeActivity(): Promise<{
  streak: UserStreakDto;
  newlyUnlocked: UserAchievementDto[];
}> {
  return apiRequest('/gamification/record-activity', {
    method: 'POST',
  });
}
