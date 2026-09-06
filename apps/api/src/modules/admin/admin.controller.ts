import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { CurrentUser, Roles } from '../auth/decorators/index.js';
import { UserRole } from '@ai-platform/types';
import type { JwtPayload } from '@ai-platform/auth';
import type { UpdateUserStatusDto, UpdatePromptTemplateDto } from '@ai-platform/types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(search, role, status);
  }

  @Patch('users/:id')
  async updateUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUser(admin.sub, id, dto);
  }

  @Get('courses')
  async getCourses() {
    return this.adminService.getCourses();
  }

  @Post('courses')
  async createCourse(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: { title: string; slug: string; description?: string; level?: string },
  ) {
    return this.adminService.createCourse(admin.sub, dto);
  }

  @Patch('courses/:id')
  async updateCourse(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; level?: string; status?: string },
  ) {
    return this.adminService.updateCourse(admin.sub, id, dto);
  }

  @Get('prompts')
  async getPromptTemplates() {
    return this.adminService.getPromptTemplates();
  }

  @Patch('prompts/:id')
  async updatePromptTemplate(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePromptTemplateDto,
  ) {
    return this.adminService.updatePromptTemplate(admin.sub, id, dto);
  }

  @Get('plans')
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Patch('plans/:id')
  async updatePlan(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() dto: { price?: number; aiUsageLimit?: number; features?: string[] },
  ) {
    return this.adminService.updatePlan(admin.sub, id, dto);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(limit ? parseInt(limit, 10) : 50);
  }
}
