import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { createLogger } from '@ai-platform/logger';
import type { CreateCourseDto, UpdateCourseDto, CourseFilterDto } from './dto/index.js';

const log = createLogger('CoursesService');

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List published courses with optional filters and pagination
   */
  async listCourses(filter: CourseFilterDto, isAdmin = false) {
    const { level, categorySlug, search, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Non-admin users only see published courses
    if (!isAdmin) {
      where['status'] = 'published';
    }

    if (level) {
      where['level'] = level;
    }

    if (search) {
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categorySlug) {
      where['categories'] = {
        some: {
          category: { slug: categorySlug },
        },
      };
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            include: { category: true },
          },
          _count: {
            select: { lessons: true, enrollments: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single course by ID or slug, with ordered lesson list
   */
  async getCourse(idOrSlug: string) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);

    const course = await this.prisma.course.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        categories: {
          include: { category: true },
        },
        lessons: {
          orderBy: { lessonOrder: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            lessonOrder: true,
            durationMinutes: true,
            createdAt: true,
            _count: { select: { contents: true } },
          },
        },
        _count: {
          select: { enrollments: true, lessons: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found: ${idOrSlug}`);
    }

    return course;
  }

  /**
   * Create a new course (admin only)
   */
  async createCourse(dto: CreateCourseDto, _adminId: string) {
    const existing = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`A course with slug "${dto.slug}" already exists`);
    }

    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        level: dto.level ?? 'beginner',
        status: dto.status ?? 'draft',
        categories:
          dto.categoryIds && dto.categoryIds.length > 0
            ? {
                create: dto.categoryIds.map((categoryId) => ({ categoryId })),
              }
            : undefined,
      },
      include: {
        categories: { include: { category: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });

    log.info({ courseId: course.id, slug: course.slug }, 'Course created');
    return course;
  }

  /**
   * Update a course (admin only)
   */
  async updateCourse(id: string, dto: UpdateCourseDto, _adminId: string) {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Course not found: ${id}`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.course.findUnique({
        where: { slug: dto.slug },
      });
      if (slugConflict) {
        throw new ConflictException(`Slug "${dto.slug}" is already in use`);
      }
    }

    const course = await this.prisma.$transaction(async (tx) => {
      // Rebuild category relations if provided
      if (dto.categoryIds !== undefined) {
        await tx.courseCategoryRelation.deleteMany({ where: { courseId: id } });
        if (dto.categoryIds.length > 0) {
          await tx.courseCategoryRelation.createMany({
            data: dto.categoryIds.map((categoryId) => ({ courseId: id, categoryId })),
          });
        }
      }

      return tx.course.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug,
          description: dto.description,
          thumbnailUrl: dto.thumbnailUrl,
          level: dto.level,
          status: dto.status,
        },
        include: {
          categories: { include: { category: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
      });
    });

    log.info({ courseId: id }, 'Course updated');
    return course;
  }

  /**
   * Enroll a user in a course
   */
  async enrollCourse(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }

    if (course.status !== 'published') {
      throw new ForbiddenException('This course is not available for enrollment');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      throw new ConflictException('You are already enrolled in this course');
    }

    const enrollment = await this.prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: { userId, courseId },
        include: { course: true },
      });

      // Initialize course progress
      await tx.courseProgress.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: {
          userId,
          courseId,
          completedLessons: 0,
          completionPercentage: 0,
        },
      });

      return newEnrollment;
    });

    log.info({ courseId, userId }, 'User enrolled in course');
    return enrollment;
  }

  /**
   * Get course progress for a user — includes per-lesson status
   */
  async getCourseProgress(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { lessonOrder: 'asc' },
          select: { id: true, title: true, lessonOrder: true, durationMinutes: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      return { enrolled: false, course, progress: null };
    }

    const [courseProgress, lessonProgresses] = await Promise.all([
      this.prisma.courseProgress.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: course.lessons.map((l) => l.id) } },
      }),
    ]);

    const lessonProgressMap = new Map(lessonProgresses.map((lp) => [lp.lessonId, lp]));

    const lessonsWithProgress = course.lessons.map((lesson) => ({
      ...lesson,
      progress: lessonProgressMap.get(lesson.id) ?? null,
    }));

    return {
      enrolled: true,
      enrolledAt: enrollment.enrolledAt,
      course: {
        id: course.id,
        title: course.title,
        level: course.level,
      },
      progress: {
        completedLessons: courseProgress?.completedLessons ?? 0,
        completionPercentage: courseProgress?.completionPercentage ?? 0,
        totalLessons: course.lessons.length,
      },
      lessons: lessonsWithProgress,
    };
  }

  /**
   * Recalculate and persist course progress percentage for a user
   * Called by LessonsService after lesson progress update
   */
  async recalculateCourseProgress(courseId: string, userId: string): Promise<void> {
    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          completed: true,
          lesson: { courseId },
        },
      }),
    ]);

    if (totalLessons === 0) return;

    const completionPercentage = Math.round((completedLessons / totalLessons) * 100);

    await this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { completedLessons, completionPercentage },
      create: { userId, courseId, completedLessons, completionPercentage },
    });
  }
}
