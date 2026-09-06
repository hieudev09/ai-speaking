import { apiRequest } from './api';

// ===================== Types =====================

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: string;
  status: string;
  createdAt: string;
  categories: { category: CourseCategory }[];
  _count: { lessons: number; enrollments: number };
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string | null;
  lessonOrder: number;
  durationMinutes: number | null;
  createdAt: string;
  _count: { contents: number };
}

export interface LessonContent {
  id: string;
  lessonId: string;
  contentType: 'TEXT' | 'VIDEO' | 'QUIZ' | 'SPEAKING' | 'VOCABULARY';
  content: Record<string, unknown>;
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  progressPercentage: number;
}

export interface CourseDetail extends CourseSummary {
  lessons: LessonSummary[];
}

export interface LessonDetail {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  lessonOrder: number;
  durationMinutes: number | null;
  contents: LessonContent[];
  course: { id: string; title: string; slug: string; level: string };
  userProgress: LessonProgress | null;
  navigation: {
    prev: { id: string; title: string; lessonOrder: number } | null;
    next: { id: string; title: string; lessonOrder: number } | null;
    totalLessons: number;
    currentIndex: number;
  };
}

export interface CoursesListResponse {
  data: CourseSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CourseProgressResponse {
  enrolled: boolean;
  enrolledAt?: string;
  course: { id: string; title: string; level: string };
  progress: {
    completedLessons: number;
    completionPercentage: number;
    totalLessons: number;
  } | null;
  lessons?: (LessonSummary & { progress: LessonProgress | null })[];
}

// ===================== Filter =====================

export interface CourseFilter {
  level?: string;
  categorySlug?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ===================== API Functions =====================

/**
 * Fetch paginated, filtered course list (public)
 */
export async function getCourses(filter: CourseFilter = {}): Promise<CoursesListResponse> {
  const params = new URLSearchParams();
  if (filter.level) params.set('level', filter.level);
  if (filter.categorySlug) params.set('categorySlug', filter.categorySlug);
  if (filter.search) params.set('search', filter.search);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.limit) params.set('limit', String(filter.limit));

  const query = params.toString();
  return apiRequest<CoursesListResponse>(`/courses${query ? `?${query}` : ''}`);
}

/**
 * Fetch a single course by ID or slug (public)
 */
export async function getCourse(idOrSlug: string): Promise<CourseDetail> {
  return apiRequest<CourseDetail>(`/courses/${idOrSlug}`);
}

/**
 * Enroll the current authenticated user in a course
 */
export async function enrollCourse(courseId: string): Promise<{ id: string; enrolledAt: string }> {
  return apiRequest(`/courses/${courseId}/enroll`, { method: 'POST' });
}

/**
 * Get the current user's enrollment and progress for a course
 */
export async function getCourseProgress(courseId: string): Promise<CourseProgressResponse> {
  return apiRequest<CourseProgressResponse>(`/courses/${courseId}/progress`);
}

/**
 * Fetch a lesson with its content blocks (public, enriched with user progress if logged in)
 */
export async function getLesson(lessonId: string): Promise<LessonDetail> {
  return apiRequest<LessonDetail>(`/lessons/${lessonId}`);
}

/**
 * Update lesson progress for the current user (percentage or completion flag)
 */
export async function updateLessonProgress(
  lessonId: string,
  data: { progressPercentage?: number; completed?: boolean },
): Promise<LessonProgress> {
  return apiRequest<LessonProgress>(`/lessons/${lessonId}/progress`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get current user's progress on a specific lesson
 */
export async function getLessonProgress(lessonId: string): Promise<LessonProgress> {
  return apiRequest<LessonProgress>(`/lessons/${lessonId}/progress`);
}
