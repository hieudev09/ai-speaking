import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourse, type LessonSummary } from '@/lib/courses';

export const revalidate = 300;

// Dynamic metadata from course data
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const course = await getCourse(id);
    return {
      title: `${course.title} — Daily speaking with me (DSWM)`,
      description: course.description ?? `Learn English with the ${course.title} course.`,
    };
  } catch {
    return { title: 'Course Not Found' };
  }
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

function LevelBadge({ level }: { level: string }) {
  const cls = LEVEL_COLORS[level] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${cls}`}>
      {level}
    </span>
  );
}

function LessonRow({ lesson, index }: { lesson: LessonSummary; index: number }) {
  return (
    <Link
      href={`/courses/${lesson.id}/lessons/${lesson.id}`}
      className="group flex items-center gap-4 rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 transition-all hover:border-indigo-500/30 hover:bg-slate-800/60"
    >
      {/* Order number */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-sm font-bold text-indigo-400 ring-1 ring-indigo-500/20">
        {index + 1}
      </div>

      {/* Title + desc */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-indigo-300">
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{lesson.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-shrink-0 items-center gap-3 text-xs text-slate-500">
        {lesson.durationMinutes && (
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lesson.durationMinutes}m
          </span>
        )}
        <svg
          className="h-4 w-4 text-slate-600 transition-colors group-hover:text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;

  let course: Awaited<ReturnType<typeof getCourse>> | null = null;

  try {
    course = await getCourse(id);
  } catch {
    notFound();
  }

  if (!course) notFound();

  const totalDuration = course.lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  const firstLessonId = course.lessons[0]?.id;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-slate-300">Courses</Link>
          <span>/</span>
          <span className="text-slate-300">{course.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero card */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm">
              {/* Thumbnail */}
              <div className="relative h-64 w-full bg-gradient-to-br from-indigo-900/60 to-slate-900">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-7xl opacity-20">📚</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              </div>

              {/* Info */}
              <div className="p-6">
                {/* Categories */}
                {course.categories.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {course.categories.map(({ category }) => (
                      <span
                        key={category.id}
                        className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="mb-3 text-3xl font-bold text-white">{course.title}</h1>

                {course.description && (
                  <p className="mb-4 text-slate-400 leading-relaxed">{course.description}</p>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <LevelBadge level={course.level} />
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {course._count.lessons} lessons
                  </span>
                  {totalDuration > 0 && (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {course._count.enrollments.toLocaleString()} students
                  </span>
                </div>
              </div>
            </div>

            {/* Lesson list */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-white">
                Course Content
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({course.lessons.length} lessons)
                </span>
              </h2>

              {course.lessons.length === 0 ? (
                <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 py-12 text-center text-sm text-slate-500">
                  No lessons added yet. Check back soon!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {course.lessons.map((lesson, i) => (
                    <LessonRow key={lesson.id} lesson={lesson} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
              <h3 className="mb-1 text-lg font-semibold text-white">Ready to start?</h3>
              <p className="mb-5 text-sm text-slate-400">
                Enroll now and get full access to all {course._count.lessons} lessons.
              </p>

              {firstLessonId ? (
                <Link
                  href={`/courses/${course.id}/lessons/${firstLessonId}`}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40"
                >
                  Start Learning
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              ) : (
                <button
                  disabled
                  className="mb-3 flex w-full items-center justify-center rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                >
                  No lessons yet
                </button>
              )}

              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Full access to all lessons
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  AI pronunciation feedback
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Progress tracking & streaks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
