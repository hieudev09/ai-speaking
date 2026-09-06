import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CoursesService } from '../courses/courses.service.js';
import { createLogger } from '@ai-platform/logger';
import type {
  CreateLessonDto,
  UpdateLessonDto,
  CreateLessonContentDto,
  UpdateProgressDto,
} from './dto/index.js';

const log = createLogger('LessonsService');

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Get a lesson with its contents; optionally include the calling user's progress
   */
  async getLesson(lessonId: string, userId?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        contents: {
          orderBy: { id: 'asc' },
        },
        course: {
          select: { id: true, title: true, slug: true, level: true, status: true },
        },
        _count: { select: { contents: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson not found: ${lessonId}`);
    }

    // Block access to lessons in non-published courses for non-admins
    if (lesson.course.status !== 'published' && !userId) {
      throw new ForbiddenException('This lesson is not publicly available');
    }

    let userProgress = null;
    if (userId) {
      userProgress = await this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
    }

    // Fetch sibling lessons for prev/next navigation
    const siblings = await this.prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      orderBy: { lessonOrder: 'asc' },
      select: { id: true, title: true, lessonOrder: true },
    });

    const currentIndex = siblings.findIndex((s) => s.id === lessonId);
    const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    const nextLesson = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

    return {
      ...lesson,
      userProgress,
      navigation: {
        prev: prevLesson,
        next: nextLesson,
        totalLessons: siblings.length,
        currentIndex: currentIndex + 1,
      },
    };
  }

  /**
   * Create a new lesson under a course (admin only)
   */
  async createLesson(dto: CreateLessonDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException(`Course not found: ${dto.courseId}`);
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        lessonOrder: dto.lessonOrder,
        durationMinutes: dto.durationMinutes,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { contents: true } },
      },
    });

    log.info({ lessonId: lesson.id, courseId: dto.courseId }, 'Lesson created');
    return lesson;
  }

  /**
   * Update lesson metadata (admin only)
   */
  async updateLesson(id: string, dto: UpdateLessonDto) {
    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Lesson not found: ${id}`);
    }

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        lessonOrder: dto.lessonOrder,
        durationMinutes: dto.durationMinutes,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { contents: true } },
      },
    });

    log.info({ lessonId: id }, 'Lesson updated');
    return lesson;
  }

  /**
   * Add a content block to a lesson (admin only)
   */
  async addLessonContent(lessonId: string, dto: CreateLessonContentDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Lesson not found: ${lessonId}`);
    }

    const content = await this.prisma.lessonContent.create({
      data: {
        lessonId,
        contentType: dto.contentType,
        content: dto.content as any,
      },
    });

    log.info({ lessonId, contentType: dto.contentType }, 'Lesson content added');
    return content;
  }

  /**
   * Update lesson progress for a user — triggers course progress recalculation
   */
  async updateProgress(lessonId: string, userId: string, dto: UpdateProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson not found: ${lessonId}`);
    }

    const now = new Date();
    const completedAt =
      dto.completed === true ? now : undefined;

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        progressPercentage: dto.progressPercentage,
        completed: dto.completed,
        completedAt: completedAt,
      },
      create: {
        userId,
        lessonId,
        progressPercentage: dto.progressPercentage ?? 0,
        completed: dto.completed ?? false,
        completedAt: completedAt ?? null,
      },
    });

    // Recalculate course-level progress
    await this.coursesService.recalculateCourseProgress(lesson.courseId, userId);

    log.info(
      { lessonId, userId, completed: dto.completed, pct: dto.progressPercentage },
      'Lesson progress updated',
    );

    return progress;
  }

  /**
   * Get current user's progress on a specific lesson
   */
  async getLessonProgress(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Lesson not found: ${lessonId}`);
    }

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    return progress ?? { userId, lessonId, completed: false, progressPercentage: 0 };
  }
}
