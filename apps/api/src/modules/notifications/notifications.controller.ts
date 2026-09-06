import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUserNotifications(user.sub);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.sub, id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }
}
