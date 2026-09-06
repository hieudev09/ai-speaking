import { apiRequest } from './api';
import type { NotificationDto } from '@ai-platform/types';

export async function getNotifications(): Promise<NotificationDto[]> {
  return apiRequest<NotificationDto[]>('/notifications');
}

export async function getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return apiRequest<{ unreadCount: number }>('/notifications/unread-count');
}

export async function markNotificationAsRead(id: string): Promise<NotificationDto> {
  return apiRequest<NotificationDto>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(): Promise<{ updatedCount: number }> {
  return apiRequest<{ updatedCount: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
