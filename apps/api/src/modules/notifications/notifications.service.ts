import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueueName, type NotificationDto, type NotificationJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('NotificationsService');

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.NOTIFICATION)
    private readonly notificationQueue: Queue<NotificationJobPayload>,
  ) {}

  /**
   * Get user notifications ordered by newest first
   */
  async getUserNotifications(userId: string, limit = 20): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      type: n.type,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      message: updated.message,
      isRead: updated.isRead,
      type: updated.type,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Send/Enqueue a notification
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type = 'general',
  ): Promise<NotificationDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    try {
      await this.notificationQueue.add('send_notification', {
        userId,
        title,
        message,
        type,
      });
    } catch (err) {
      log.warn({ err }, 'Failed to enqueue notification job to BullMQ');
    }

    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
