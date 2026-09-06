import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: JwtPayload) {
    return this.usersService.getSettings(user.sub);
  }

  @Put('settings')
  async updateSettings(@CurrentUser() user: JwtPayload, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(user.sub, dto);
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.usersService.getDashboard(user.sub);
  }
}
