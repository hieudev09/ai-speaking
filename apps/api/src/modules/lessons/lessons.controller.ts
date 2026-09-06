import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service.js';
import {
  CreateLessonDto,
  UpdateLessonDto,
  CreateLessonContentDto,
  UpdateProgressDto,
} from './dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles, CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '@ai-platform/types';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  /**
   * GET /api/v1/lessons/:id
   * Public (optionally enriched with user progress if authenticated)
   */
  @Get(':id')
  async getLesson(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.getLesson(id, user?.sub);
  }

  /**
   * POST /api/v1/lessons
   * Admin only — create a new lesson under a course
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.lessonsService.createLesson(dto);
  }

  /**
   * PATCH /api/v1/lessons/:id
   * Admin only — update lesson metadata
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.updateLesson(id, dto);
  }

  /**
   * POST /api/v1/lessons/:id/contents
   * Admin only — add a content block to a lesson
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/contents')
  async addLessonContent(@Param('id') id: string, @Body() dto: CreateLessonContentDto) {
    return this.lessonsService.addLessonContent(id, dto);
  }

  /**
   * POST /api/v1/lessons/:id/progress
   * Authenticated — update lesson progress for current user
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.updateProgress(id, user.sub, dto);
  }

  /**
   * GET /api/v1/lessons/:id/progress
   * Authenticated — get current user's progress on a lesson
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  async getLessonProgress(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lessonsService.getLessonProgress(id, user.sub);
  }
}
