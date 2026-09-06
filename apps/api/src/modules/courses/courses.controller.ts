import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto, UpdateCourseDto, CourseFilterDto } from './dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '@ai-platform/types';
import type { JwtPayload } from '@ai-platform/auth';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * GET /api/v1/courses
   * Public — list all published courses with filters
   */
  @Get()
  async listCourses(@Query() filter: CourseFilterDto) {
    return this.coursesService.listCourses(filter);
  }

  /**
   * GET /api/v1/courses/:id
   * Public — single course by ID or slug with lesson list
   */
  @Get(':id')
  async getCourse(@Param('id') id: string) {
    return this.coursesService.getCourse(id);
  }

  /**
   * POST /api/v1/courses
   * Admin only — create a new course
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: JwtPayload) {
    return this.coursesService.createCourse(dto, user.sub);
  }

  /**
   * PATCH /api/v1/courses/:id
   * Admin only — update course details
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.coursesService.updateCourse(id, dto, user.sub);
  }

  /**
   * POST /api/v1/courses/:id/enroll
   * Authenticated — enroll current user in course
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/enroll')
  @HttpCode(HttpStatus.CREATED)
  async enrollCourse(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.enrollCourse(id, user.sub);
  }

  /**
   * GET /api/v1/courses/:id/progress
   * Authenticated — get enrollment + progress for current user
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  async getCourseProgress(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.getCourseProgress(id, user.sub);
  }
}
